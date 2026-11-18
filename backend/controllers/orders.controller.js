import { pool } from "../db/pool.js";
import { notify } from "../services/notifications.service.js";
import { FIT_TYPES_BY_GARMENT, LAPEL_STYLES } from "../constants/fitTypes.js";

const GARMENT_TYPES = ["shirt", "pant", "panjabi", "suit_2pc", "suit_3pc", "kurta", "blouse", "other"];
const PRIORITIES = ["normal", "fast", "urgent"];

const ORDER_COLUMNS = `
  id, customer_id, garment_type, style_notes, fabric_note, fit_type, lapel_style,
  priority, status,
  measurements_snapshot, due_date,
  quoted_price::double precision AS quoted_price,
  advance_required::double precision AS advance_required,
  created_at, updated_at
`;

// fit_type is a cut/ease instruction (e.g. "slim"), not a measurement — see
// design doc "Revision note 2". A garment with no fixed list (garmentType:
// "other") accepts any value.
function fitTypeError(garmentType, fitType) {
  if (fitType === undefined || fitType === null) return null;
  const allowed = FIT_TYPES_BY_GARMENT[garmentType];
  if (allowed && !allowed.includes(fitType)) {
    return `Unrecognized fit_type for garment_type ${garmentType}`;
  }
  return null;
}

function lapelStyleError(lapelStyle) {
  if (lapelStyle === undefined || lapelStyle === null) return null;
  return LAPEL_STYLES.includes(lapelStyle) ? null : "Unrecognized lapel_style";
}

// double precision cast: pg returns `numeric` columns as strings otherwise
// (see Task 4's ledger entry); reused by createOrder and patchOrder so the
// 14-field cast list lives in one place.
const MEASUREMENTS_SELECT = [
  "chest", "waist", "hip", "shoulder_width", "sleeve_length", "inseam", "neck",
  "bicep", "wrist", "thigh", "knee", "rise", "hem", "garment_length",
]
  .map((col) => `${col}::double precision AS ${col}`)
  .join(", ");

async function getMeasurementsSnapshot(customerId) {
  const result = await pool.query(
    `SELECT ${MEASUREMENTS_SELECT} FROM measurements WHERE customer_id = $1`,
    [customerId]
  );
  return result.rows[0] ?? null;
}

export async function createOrder(req, res) {
  const { garmentType, styleNotes, fabricNote, priority = "normal", fitType, lapelStyle } = req.body;

  if (!GARMENT_TYPES.includes(garmentType)) {
    return res.status(400).json({ message: "Unrecognized garment type" });
  }
  if (!PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: "Unrecognized priority" });
  }
  if (garmentType === "other" && !styleNotes?.trim()) {
    return res.status(400).json({ message: "A note is required when garment type is 'other'" });
  }
  const fitError = fitTypeError(garmentType, fitType);
  if (fitError) return res.status(400).json({ message: fitError });
  const lapelError = lapelStyleError(lapelStyle);
  if (lapelError) return res.status(400).json({ message: lapelError });

  const snapshot = await getMeasurementsSnapshot(req.user.id);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderResult = await client.query(
      `INSERT INTO orders (customer_id, garment_type, style_notes, fabric_note, fit_type, lapel_style, priority, measurements_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${ORDER_COLUMNS}`,
      [
        req.user.id,
        garmentType,
        styleNotes ?? null,
        fabricNote ?? null,
        fitType ?? null,
        lapelStyle ?? null,
        priority,
        snapshot,
      ]
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
  ownerId = null,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // ownerId scopes the lookup itself, so a non-owner gets the same
    // OrderNotFoundError (-> 404) as a nonexistent order, not a 403 that
    // would confirm the order exists for someone else.
    const current = ownerId
      ? await client.query(`SELECT status FROM orders WHERE id = $1 AND customer_id = $2 FOR UPDATE`, [
          orderId,
          ownerId,
        ])
      : await client.query(`SELECT status FROM orders WHERE id = $1 FOR UPDATE`, [orderId]);
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

export async function patchOrder(req, res) {
  const { garmentType, styleNotes, fabricNote, priority, fitType, lapelStyle } = req.body;

  if (garmentType !== undefined && !GARMENT_TYPES.includes(garmentType)) {
    return res.status(400).json({ message: "Unrecognized garment type" });
  }
  if (priority !== undefined && !PRIORITIES.includes(priority)) {
    return res.status(400).json({ message: "Unrecognized priority" });
  }
  // Validate fit_type against the (possibly updated) garment type — if
  // garmentType isn't being changed this PATCH, fall back to the order's
  // current one so a fit_type change alone is still checked correctly.
  let effectiveGarmentType = garmentType;
  if (effectiveGarmentType === undefined && fitType !== undefined) {
    const current = await pool.query(`SELECT garment_type FROM orders WHERE id = $1`, [req.params.id]);
    effectiveGarmentType = current.rows[0]?.garment_type;
  }
  const fitError = fitTypeError(effectiveGarmentType, fitType);
  if (fitError) return res.status(400).json({ message: fitError });
  const lapelError = lapelStyleError(lapelStyle);
  if (lapelError) return res.status(400).json({ message: lapelError });

  const snapshot = await getMeasurementsSnapshot(req.user.id);

  const extraColumns = { measurements_snapshot: snapshot };
  if (garmentType !== undefined) extraColumns.garment_type = garmentType;
  if (styleNotes !== undefined) extraColumns.style_notes = styleNotes;
  if (fabricNote !== undefined) extraColumns.fabric_note = fabricNote;
  if (priority !== undefined) extraColumns.priority = priority;
  if (fitType !== undefined) extraColumns.fit_type = fitType;
  if (lapelStyle !== undefined) extraColumns.lapel_style = lapelStyle;

  try {
    const order = await transitionOrder({
      orderId: req.params.id,
      toStatus: "requested",
      changedBy: "customer",
      fromStatuses: ["needs_changes"],
      extraColumns,
      ownerId: req.user.id,
    });
    res.json(order);
  } catch (err) {
    if (!mapTransitionError(err, res)) throw err;
  }
}

export async function declineOrder(req, res) {
  try {
    const order = await transitionOrder({
      orderId: req.params.id,
      toStatus: "declined",
      changedBy: "customer",
      fromStatuses: ["quoted"],
      ownerId: req.user.id,
    });
    const adminResult = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
    const admin = adminResult.rows[0];
    if (admin) {
      await notify({
        sender: "system",
        recipientId: admin.id,
        message: `Order #${order.id} was declined by the customer.`,
        orderId: order.id,
      });
    }
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
