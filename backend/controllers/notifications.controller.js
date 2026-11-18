import { pool } from "../db/pool.js";
import { notify } from "../services/notifications.service.js";

export async function getMyNotifications(req, res) {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE recipient_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
}

export async function markNotificationRead(req, res) {
  const result = await pool.query(
    `UPDATE notifications SET is_read = true WHERE id = $1 AND recipient_id = $2 RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Notification not found" });
  }
  res.json(result.rows[0]);
}

export async function sendCustomNotification(req, res) {
  const { customerId, message, orderId } = req.body;
  if (!customerId || !message) {
    return res.status(400).json({ message: "customerId and message are required" });
  }
  const n = await notify({ sender: "admin", recipientId: customerId, message, orderId: orderId ?? null });
  res.status(201).json(n);
}
