import { pool } from "../db/pool.js";
import { sslcommerzService } from "../services/sslcommerz.service.js";
import { transitionOrder, InvalidTransitionError } from "./orders.controller.js";
import { notify } from "../services/notifications.service.js";

export async function confirmOrder(req, res) {
  const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1 AND customer_id = $2`, [
    req.params.id,
    req.user.id,
  ]);
  const order = orderResult.rows[0];
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (order.status !== "quoted") {
    return res.status(409).json({ message: `cannot confirm an order in status ${order.status}` });
  }

  const customerResult = await pool.query(
    `SELECT name, email, phone_number FROM users WHERE id = $1`,
    [req.user.id]
  );

  const { gatewayUrl, tranId } = await sslcommerzService.initSslcommerzSession({
    order,
    customer: customerResult.rows[0],
  });
  await pool.query(`UPDATE orders SET pending_tran_id = $1 WHERE id = $2`, [tranId, order.id]);

  res.json({ gatewayUrl });
}

// SSLCommerz's own server posts here (success/fail/cancel/IPN all point at
// this one route) — no requireAuth; trust comes from validating the
// transaction with SSLCommerz itself, not from a bearer token.
export async function sslcommerzCallback(req, res) {
  const { tran_id: tranId, val_id: valId, status } = req.body;
  if (!tranId) {
    return res.status(400).json({ message: "Missing tran_id" });
  }

  const orderResult = await pool.query(`SELECT * FROM orders WHERE pending_tran_id = $1`, [tranId]);
  const order = orderResult.rows[0];
  if (!order) {
    return res.status(404).json({ message: "No matching order for this transaction" });
  }

  if (status !== "VALID" && status !== "VALIDATED") {
    // failed/cancelled attempt: leave the order exactly as it was, nothing to roll back.
    return res.json({ status: "ignored" });
  }

  const validation = await sslcommerzService.validateSslcommerzTransaction({ tranId, valId });
  if (!validation.valid || Number(validation.amount) !== Number(order.advance_required)) {
    console.warn(
      `SSLCommerz validation failed or amount mismatch for order ${order.id} (tran_id ${tranId})`
    );
    return res.json({ status: "not_confirmed" });
  }

  await pool.query(
    `INSERT INTO payments (order_id, type, amount, gateway_transaction_id) VALUES ($1, 'advance', $2, $3)`,
    [order.id, order.advance_required, tranId]
  );

  try {
    await transitionOrder({
      orderId: order.id,
      toStatus: "confirmed",
      changedBy: "system",
      fromStatuses: ["quoted"],
    });
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      // Payment landed twice, or the order moved on in the meantime — the
      // payment row above already recorded the money; don't throw it away.
      console.warn(`Order ${order.id} already left 'quoted' by the time payment was validated.`);
      return res.json({ status: "payment_recorded_status_unchanged" });
    }
    throw err;
  }

  await notify({
    sender: "system",
    recipientId: order.customer_id,
    message: `Your order #${order.id} is confirmed — advance payment received.`,
    orderId: order.id,
  });

  res.json({ status: "confirmed" });
}

export async function recordBalancePayment(req, res) {
  const { amount } = req.body;
  if (typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ message: "amount must be a positive number" });
  }

  const orderResult = await pool.query(`SELECT id FROM orders WHERE id = $1`, [req.params.id]);
  if (orderResult.rows.length === 0) {
    return res.status(404).json({ message: "Order not found" });
  }

  const result = await pool.query(
    `INSERT INTO payments (order_id, type, amount) VALUES ($1, 'balance', $2)
     RETURNING id, order_id, type, amount::double precision AS amount, gateway_transaction_id, recorded_at`,
    [req.params.id, amount]
  );
  res.status(201).json(result.rows[0]);
}
