import { pool } from "../db/pool.js";

export async function notify({ sender, recipientId, message, orderId = null }) {
  const result = await pool.query(
    `INSERT INTO notifications (sender, recipient_id, message, order_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [sender, recipientId, message, orderId]
  );
  return result.rows[0];
}
