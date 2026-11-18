import { pool } from "../db/pool.js";
import { notify } from "../services/notifications.service.js";

const GARMENT_TYPES = ["shirt", "pant", "panjabi", "suit_2pc", "suit_3pc", "kurta", "blouse", "other"];
const PRIORITIES = ["normal", "fast", "urgent"];

const ORDER_COLUMNS = `
  id, customer_id, garment_type, style_notes, fabric_note, priority, status,
  measurements_snapshot, due_date,
  quoted_price::double precision AS quoted_price,
  advance_required::double precision AS advance_required,
  created_at, updated_at
`;

export async function createOrder(req, res) {
  const { garmentType, styleNotes, fabricNote, priority = "normal" } = req.body;

  if (!GARMENT_TYPES.includes(garmentType)) {
    return res.status(400).json({ message: "Unrecognized garment type" });
  }
  if (!PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: "Unrecognized priority" });
  }
  if (garmentType === "other" && !styleNotes?.trim()) {
    return res.status(400).json({ message: "A note is required when garment type is 'other'" });
  }

  // double precision cast: pg returns `numeric` columns as strings otherwise
  // (see Task 4's ledger entry — same issue, reused fix here).
  const measurementsResult = await pool.query(
    `SELECT chest::double precision AS chest, waist::double precision AS waist,
            hip::double precision AS hip, shoulder_width::double precision AS shoulder_width,
            sleeve_length::double precision AS sleeve_length, inseam::double precision AS inseam,
            neck::double precision AS neck
     FROM measurements WHERE customer_id = $1`,
    [req.user.id]
  );
  const snapshot = measurementsResult.rows[0] ?? null;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, garment_type, style_notes, fabric_note, priority, measurements_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${ORDER_COLUMNS}`,
      [req.user.id, garmentType, styleNotes ?? null, fabricNote ?? null, priority, snapshot]
    );
    const order = orderResult.rows[0];

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, changed_by)
       VALUES ($1, NULL, 'requested', 'customer')`,
      [order.id]
    );
    await client.query("COMMIT");

    const [adminResult, customerResult] = await Promise.all([
      pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`),
      pool.query(`SELECT name FROM users WHERE id = $1`, [req.user.id]),
    ]);
    const admin = adminResult.rows[0];
    if (admin) {
      await notify({
        sender: "system",
        recipientId: admin.id,
        message: `New order #${order.id} from ${customerResult.rows[0]?.name ?? "a customer"}`,
        orderId: order.id,
      });
    }

    res.status(201).json(order);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listMyOrders(req, res) {
  const result = await pool.query(
    `SELECT ${ORDER_COLUMNS} FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
}

export async function getOrderById(req, res) {
  const result = await pool.query(
    `SELECT ${ORDER_COLUMNS} FROM orders WHERE id = $1 AND customer_id = $2`,
    [req.params.id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Order not found" });
  }
  res.json(result.rows[0]);
}

export class OrderNotFoundError extends Error {}
export class InvalidTransitionError extends Error {}

// Shared by every status change (Tasks 6-9): reads the order's current
// status, checks it's one this transition is allowed to start from, then
// updates status (plus any extraColumns) and inserts the history row in
// one transaction. Throws OrderNotFoundError / InvalidTransitionError for
// the controller to map to 404 / 409.
export async function transitionOrder({
  orderId,
  toStatus,
  changedBy,
  note = null,
  fromStatuses,
  extraColumns = {},
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const current = await client.query(`SELECT status FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
    if (current.rows.length === 0) {
      throw new OrderNotFoundError();
    }
    const fromStatus = current.rows[0].status;
    if (!fromStatuses.includes(fromStatus)) {
      throw new InvalidTransitionError(`cannot move from ${fromStatus} to ${toStatus}`);
    }

    const setClauses = ["status = $2", "updated_at = now()"];
    const values = [orderId, toStatus];
    for (const [column, value] of Object.entries(extraColumns)) {
      values.push(value);
      setClauses.push(`${column} = $${values.length}`);
    }
    const updated = await client.query(
      `UPDATE orders SET ${setClauses.join(", ")} WHERE id = $1 RETURNING ${ORDER_COLUMNS}`,
      values
    );

    await client.query(
      `INSERT INTO order_status_history (order_id, from_status, to_status, note, changed_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [orderId, fromStatus, toStatus, note, changedBy]
    );
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

function mapTransitionError(err, res) {
  if (err instanceof OrderNotFoundError) {
    res.status(404).json({ message: "Order not found" });
    return true;
  }
  if (err instanceof InvalidTransitionError) {
    res.status(409).json({ message: err.message });
    return true;
  }
  return false;
}

export async function rejectOrder(req, res) {
  const { reason } = req.body;
  if (!reason?.trim()) {
    return res.status(400).json({ message: "A reason is required to reject an order" });
  }
  try {
    const order = await transitionOrder({
      orderId: req.params.id,
      toStatus: "needs_changes",
      changedBy: "admin",
      note: reason,
      fromStatuses: ["requested"],
    });
    await notify({ sender: "admin", recipientId: order.customer_id, message: reason, orderId: order.id });
    res.json(order);
  } catch (err) {
    if (!mapTransitionError(err, res)) throw err;
  }
}

export async function quoteOrder(req, res) {
  const { dueDate, quotedPrice, advanceRequired } = req.body;
  if (dueDate === undefined || quotedPrice === undefined || advanceRequired === undefined) {
    return res.status(400).json({ message: "dueDate, quotedPrice, and advanceRequired are required" });
  }
  if (isNaN(new Date(dueDate).getTime())) {
    return res.status(400).json({ message: "dueDate is not a valid date" });
  }
  if (typeof quotedPrice !== "number" || typeof advanceRequired !== "number") {
    return res.status(400).json({ message: "quotedPrice and advanceRequired must be numbers" });
  }
  if (advanceRequired > quotedPrice) {
    return res.status(400).json({ message: "advanceRequired cannot exceed quotedPrice" });
  }

  try {
    const order = await transitionOrder({
      orderId: req.params.id,
      toStatus: "quoted",
      changedBy: "admin",
      fromStatuses: ["requested"],
      extraColumns: { due_date: dueDate, quoted_price: quotedPrice, advance_required: advanceRequired },
    });
    await notify({
      sender: "system",
      recipientId: order.customer_id,
      message: `Your order #${order.id} is quoted: ৳${quotedPrice} total, ৳${advanceRequired} due now, by ${dueDate}.`,
      orderId: order.id,
    });
    res.json(order);
  } catch (err) {
    if (!mapTransitionError(err, res)) throw err;
  }
}

export async function listAllOrders(req, res) {
  const { status } = req.query;
  const result = status
    ? await pool.query(`SELECT ${ORDER_COLUMNS} FROM orders WHERE status = $1 ORDER BY created_at DESC`, [status])
    : await pool.query(`SELECT ${ORDER_COLUMNS} FROM orders ORDER BY created_at DESC`);
  res.json(result.rows);
}
