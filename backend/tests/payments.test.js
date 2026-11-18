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

async function createQuotedOrder(adminAuth, customerAuth) {
  const created = await request(app).post("/orders").set("Authorization", customerAuth).send({ garmentType: "shirt" });
  await request(app)
    .patch(`/admin/orders/${created.body.id}/quote`)
    .set("Authorization", adminAuth)
    .send({ dueDate: "2026-12-01", quotedPrice: 3000, advanceRequired: 1500 });
  return created.body;
}

test("POST /orders/:id/confirm on a quoted order calls initSslcommerzSession and returns its gateway URL", async (t) => {
  t.mock.method(sslcommerzService, "initSslcommerzSession", async () => ({
    gatewayUrl: "https://sandbox.sslcommerz.com/pay/abc",
    tranId: "tt-fake-1",
  }));

  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customerAuth = `Bearer ${signToken(customer)}`;
  const order = await createQuotedOrder(adminAuth, customerAuth);

  const res = await request(app).post(`/orders/${order.id}/confirm`).set("Authorization", customerAuth);
  assert.equal(res.status, 200);
  assert.equal(res.body.gatewayUrl, "https://sandbox.sslcommerz.com/pay/abc");
});

test("confirm on a non-quoted order returns 409", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const customerAuth = `Bearer ${signToken(customer)}`;
  const created = await request(app).post("/orders").set("Authorization", customerAuth).send({ garmentType: "shirt" });

  const res = await request(app).post(`/orders/${created.body.id}/confirm`).set("Authorization", customerAuth);
  assert.equal(res.status, 409);
});

test("POST /payments/sslcommerz/callback with a validated success marks the advance paid and the order confirmed", async (t) => {
  t.mock.method(sslcommerzService, "initSslcommerzSession", async () => ({
    gatewayUrl: "https://sandbox.sslcommerz.com/pay/abc",
    tranId: "tt-fake-2",
  }));
  t.mock.method(sslcommerzService, "validateSslcommerzTransaction", async () => ({ valid: true, amount: 1500 }));

  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const order = await createQuotedOrder(`Bearer ${signToken(admin)}`, `Bearer ${signToken(customer)}`);
  await request(app).post(`/orders/${order.id}/confirm`).set("Authorization", `Bearer ${signToken(customer)}`);

  const res = await request(app)
    .post("/payments/sslcommerz/callback")
    .send({ tran_id: "tt-fake-2", val_id: "val-1", status: "VALID" });
  assert.equal(res.status, 200);

  const orderRow = await testPool.query("SELECT status FROM orders WHERE id = $1", [order.id]);
  assert.equal(orderRow.rows[0].status, "confirmed");

  const paymentRow = await testPool.query("SELECT * FROM payments WHERE order_id = $1", [order.id]);
  assert.equal(paymentRow.rows.length, 1);
  assert.equal(paymentRow.rows[0].type, "advance");
  assert.equal(paymentRow.rows[0].gateway_transaction_id, "tt-fake-2");
});

test("callback with validateSslcommerzTransaction returning invalid does NOT mark the order confirmed", async (t) => {
  t.mock.method(sslcommerzService, "initSslcommerzSession", async () => ({
    gatewayUrl: "https://sandbox.sslcommerz.com/pay/abc",
    tranId: "tt-fake-3",
  }));
  t.mock.method(sslcommerzService, "validateSslcommerzTransaction", async () => ({ valid: false, amount: 0 }));

  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const order = await createQuotedOrder(`Bearer ${signToken(admin)}`, `Bearer ${signToken(customer)}`);
  await request(app).post(`/orders/${order.id}/confirm`).set("Authorization", `Bearer ${signToken(customer)}`);

  await request(app)
    .post("/payments/sslcommerz/callback")
    .send({ tran_id: "tt-fake-3", val_id: "bad-val", status: "VALID" });

  const orderRow = await testPool.query("SELECT status FROM orders WHERE id = $1", [order.id]);
  assert.equal(orderRow.rows[0].status, "quoted");
});

test("callback reporting failed/cancelled leaves the order in 'quoted'", async (t) => {
  t.mock.method(sslcommerzService, "initSslcommerzSession", async () => ({
    gatewayUrl: "https://sandbox.sslcommerz.com/pay/abc",
    tranId: "tt-fake-4",
  }));

  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const order = await createQuotedOrder(`Bearer ${signToken(admin)}`, `Bearer ${signToken(customer)}`);
  await request(app).post(`/orders/${order.id}/confirm`).set("Authorization", `Bearer ${signToken(customer)}`);

  await request(app)
    .post("/payments/sslcommerz/callback")
    .send({ tran_id: "tt-fake-4", status: "CANCELLED" });

  const orderRow = await testPool.query("SELECT status FROM orders WHERE id = $1", [order.id]);
  assert.equal(orderRow.rows[0].status, "quoted");
});

test("POST /admin/orders/:id/payments records a manual balance payment, admin-only, no gateway_transaction_id", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customerAuth = `Bearer ${signToken(customer)}`;
  const order = await createQuotedOrder(adminAuth, customerAuth);

  const forbidden = await request(app)
    .post(`/admin/orders/${order.id}/payments`)
    .set("Authorization", customerAuth)
    .send({ amount: 1500 });
  assert.equal(forbidden.status, 403);

  const res = await request(app)
    .post(`/admin/orders/${order.id}/payments`)
    .set("Authorization", adminAuth)
    .send({ amount: 1500 });
  assert.equal(res.status, 201);
  assert.equal(res.body.type, "balance");
  assert.equal(res.body.gateway_transaction_id, null);
});
