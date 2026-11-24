import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, insertTestUser, testPool } from "./helpers/db.js";
import { signToken } from "../controllers/auth.controller.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

async function createRequestedOrder(customerAuth) {
  const res = await request(app)
    .post("/orders")
    .set("Authorization", customerAuth)
    .send({ garmentType: "shirt" });
  return res.body;
}

test("PATCH /admin/orders/:id/reject moves requested -> needs_changes with the given note, non-admin gets 403", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const customerAuth = `Bearer ${signToken(customer)}`;
  const order = await createRequestedOrder(customerAuth);

  const forbidden = await request(app)
    .patch(`/admin/orders/${order.id}/reject`)
    .set("Authorization", customerAuth)
    .send({ reason: "fabric unavailable" });
  assert.equal(forbidden.status, 403);

  const res = await request(app)
    .patch(`/admin/orders/${order.id}/reject`)
    .set("Authorization", `Bearer ${signToken(admin)}`)
    .send({ reason: "fabric unavailable" });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "needs_changes");
});

test("rejecting a non-requested order (e.g. already accepted) returns 409", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customer = await insertTestUser({ role: "customer" });
  const order = await createRequestedOrder(`Bearer ${signToken(customer)}`);

  await request(app).patch(`/admin/orders/${order.id}/accept`).set("Authorization", adminAuth);

  const res = await request(app)
    .patch(`/admin/orders/${order.id}/reject`)
    .set("Authorization", adminAuth)
    .send({ reason: "too late now" });
  assert.equal(res.status, 409);
});

test("PATCH /admin/orders/:id/accept moves requested -> confirmed directly, no body required", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const order = await createRequestedOrder(`Bearer ${signToken(customer)}`);

  const res = await request(app)
    .patch(`/admin/orders/${order.id}/accept`)
    .set("Authorization", `Bearer ${signToken(admin)}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.status, "confirmed");
});

test("accept on a non-requested order returns 409", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customer = await insertTestUser({ role: "customer" });
  const order = await createRequestedOrder(`Bearer ${signToken(customer)}`);

  await request(app).patch(`/admin/orders/${order.id}/accept`).set("Authorization", adminAuth);

  const res = await request(app)
    .patch(`/admin/orders/${order.id}/accept`)
    .set("Authorization", adminAuth);
  assert.equal(res.status, 409);
});

test("both reject and accept notify the customer", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customer = await insertTestUser({ role: "customer" });
  const order = await createRequestedOrder(`Bearer ${signToken(customer)}`);

  await request(app)
    .patch(`/admin/orders/${order.id}/reject`)
    .set("Authorization", adminAuth)
    .send({ reason: "fabric unavailable" });

  const { rows } = await testPool.query(
    "SELECT * FROM notifications WHERE recipient_id = $1 AND sender = 'admin'",
    [customer.id]
  );
  assert.equal(rows.length, 1);
  assert.match(rows[0].message, /fabric unavailable/);
});

test("accepting notifies the customer", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customer = await insertTestUser({ role: "customer" });
  const order = await createRequestedOrder(`Bearer ${signToken(customer)}`);

  await request(app).patch(`/admin/orders/${order.id}/accept`).set("Authorization", adminAuth);

  const { rows } = await testPool.query(
    "SELECT * FROM notifications WHERE recipient_id = $1 AND order_id = $2",
    [customer.id, order.id]
  );
  assert.equal(rows.length, 1);
});

test("GET /admin/orders filters by ?status=requested, admin-only", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customer = await insertTestUser({ role: "customer" });
  const customerAuth = `Bearer ${signToken(customer)}`;
  const order1 = await createRequestedOrder(customerAuth);
  await createRequestedOrder(customerAuth);

  await request(app).patch(`/admin/orders/${order1.id}/accept`).set("Authorization", adminAuth);

  const forbidden = await request(app).get("/admin/orders").set("Authorization", customerAuth);
  assert.equal(forbidden.status, 403);

  const res = await request(app).get("/admin/orders?status=requested").set("Authorization", adminAuth);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
});
