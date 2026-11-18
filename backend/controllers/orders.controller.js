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
