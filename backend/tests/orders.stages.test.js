import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, insertTestUser, testPool } from "./helpers/db.js";
import { signToken } from "../controllers/auth.controller.js";
import { app } from "../app.js";
import { sslcommerzService } from "../services/sslcommerz.service.js";

beforeEach(async () => {
  await resetTables();
});

async function createConfirmedOrder(t, adminAuth, customerAuth) {
  t.mock.method(sslcommerzService, "initSslcommerzSession", async () => ({
    gatewayUrl: "https://sandbox.sslcommerz.com/pay/abc",
    tranId: "tt-stage-test",
  }));
  t.mock.method(sslcommerzService, "validateSslcommerzTransaction", async () => ({
    valid: true,
    amount: 1500,
  }));

  const created = await request(app).post("/orders").set("Authorization", customerAuth).send({ garmentType: "shirt" });
  await request(app)
    .patch(`/admin/orders/${created.body.id}/quote`)
    .set("Authorization", adminAuth)
    .send({ dueDate: "2026-12-01", quotedPrice: 3000, advanceRequired: 1500 });
  await request(app).post(`/orders/${created.body.id}/confirm`).set("Authorization", customerAuth);
  await request(app)
    .post("/payments/sslcommerz/callback")
    .send({ tran_id: "tt-stage-test", val_id: "val-1", status: "VALID" });
  return created.body.id;
}

test("PATCH /admin/orders/:id/status confirmed -> cutting succeeds, customer notified, optional note included in the history row", async (t) => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const orderId = await createConfirmedOrder(t, adminAuth, `Bearer ${signToken(customer)}`);

  const res = await request(app)
    .patch(`/admin/orders/${orderId}/status`)
    .set("Authorization", adminAuth)
    .send({ toStatus: "cutting", note: "started cutting the fabric" });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, "cutting");

  const history = await testPool.query(
    "SELECT * FROM order_status_history WHERE order_id = $1 AND to_status = 'cutting'",
    [orderId]
  );
  assert.equal(history.rows[0].note, "started cutting the fabric");

  const notifications = await testPool.query(
    "SELECT * FROM notifications WHERE recipient_id = $1 AND order_id = $2",
    [customer.id, orderId]
  );
  assert.ok(notifications.rows.some((n) => /cutting/.test(n.message)));
});

test("attempting to skip a stage (confirmed -> stitching) returns 409", async (t) => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const orderId = await createConfirmedOrder(t, adminAuth, `Bearer ${signToken(customer)}`);

  const res = await request(app)
    .patch(`/admin/orders/${orderId}/status`)
    .set("Authorization", adminAuth)
    .send({ toStatus: "stitching" });
  assert.equal(res.status, 409);
});

test("attempting to advance a declined or needs_changes order returns 409", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customerAuth = `Bearer ${signToken(customer)}`;
  const created = await request(app).post("/orders").set("Authorization", customerAuth).send({ garmentType: "shirt" });
  await request(app)
    .patch(`/admin/orders/${created.body.id}/reject`)
    .set("Authorization", adminAuth)
    .send({ reason: "fabric unavailable" });

  const res = await request(app)
    .patch(`/admin/orders/${created.body.id}/status`)
    .set("Authorization", adminAuth)
    .send({ toStatus: "cutting" });
  assert.equal(res.status, 409);
});

test("non-admin gets 403", async (t) => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const customerAuth = `Bearer ${signToken(customer)}`;
  const orderId = await createConfirmedOrder(t, `Bearer ${signToken(admin)}`, customerAuth);

  const res = await request(app)
    .patch(`/admin/orders/${orderId}/status`)
    .set("Authorization", customerAuth)
    .send({ toStatus: "cutting" });
  assert.equal(res.status, 403);
});
