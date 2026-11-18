import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, insertTestUser, testPool } from "./helpers/db.js";
import { signToken } from "../controllers/auth.controller.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

async function createNeedsChangesOrder(adminAuth, customerAuth) {
  const created = await request(app).post("/orders").set("Authorization", customerAuth).send({ garmentType: "shirt" });
  await request(app)
    .patch(`/admin/orders/${created.body.id}/reject`)
    .set("Authorization", adminAuth)
    .send({ reason: "fabric unavailable" });
  return created.body;
}

async function createQuotedOrder(adminAuth, customerAuth) {
  const created = await request(app).post("/orders").set("Authorization", customerAuth).send({ garmentType: "shirt" });
  await request(app)
    .patch(`/admin/orders/${created.body.id}/quote`)
    .set("Authorization", adminAuth)
    .send({ dueDate: "2026-12-01", quotedPrice: 3000, advanceRequired: 1000 });
  return created.body;
}

test("PATCH /orders/:id edits garment_type/style_notes/fabric_note/priority while needs_changes, and moves it back to requested", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customerAuth = `Bearer ${signToken(customer)}`;
  const order = await createNeedsChangesOrder(adminAuth, customerAuth);

  const res = await request(app)
    .patch(`/orders/${order.id}`)
    .set("Authorization", customerAuth)
    .send({ garmentType: "pant", styleNotes: "updated note", fabricNote: "cotton", priority: "fast" });

  assert.equal(res.status, 200);
  assert.equal(res.body.status, "requested");
  assert.equal(res.body.garment_type, "pant");
  assert.equal(res.body.style_notes, "updated note");
  assert.equal(res.body.priority, "fast");
});

test("PATCH /orders/:id on an order not in needs_changes returns 409", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const customerAuth = `Bearer ${signToken(customer)}`;
  const created = await request(app).post("/orders").set("Authorization", customerAuth).send({ garmentType: "shirt" });

  const res = await request(app)
    .patch(`/orders/${created.body.id}`)
    .set("Authorization", customerAuth)
    .send({ garmentType: "pant" });
  assert.equal(res.status, 409);
});

test("PATCH /orders/:id on someone else's order returns 404", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const alice = await insertTestUser({ role: "customer" });
  const bob = await insertTestUser({ role: "customer" });
  const order = await createNeedsChangesOrder(adminAuth, `Bearer ${signToken(alice)}`);

  const res = await request(app)
    .patch(`/orders/${order.id}`)
    .set("Authorization", `Bearer ${signToken(bob)}`)
    .send({ garmentType: "pant" });
  assert.equal(res.status, 404);
});

test("PATCH /orders/:id never changes due_date/quoted_price/advance_required even if sent in the body", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customerAuth = `Bearer ${signToken(customer)}`;
  const order = await createNeedsChangesOrder(adminAuth, customerAuth);

  const res = await request(app)
    .patch(`/orders/${order.id}`)
    .set("Authorization", customerAuth)
    .send({ garmentType: "pant", quotedPrice: 999999, dueDate: "2099-01-01" });

  assert.equal(res.status, 200);
  assert.equal(res.body.quoted_price, null);
  assert.equal(res.body.due_date, null);
});

test("POST /orders/:id/decline moves quoted -> declined, admin gets notified", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customerAuth = `Bearer ${signToken(customer)}`;
  const order = await createQuotedOrder(adminAuth, customerAuth);

  const res = await request(app).post(`/orders/${order.id}/decline`).set("Authorization", customerAuth);
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "declined");

  const { rows } = await testPool.query(
    "SELECT * FROM notifications WHERE recipient_id = $1 AND sender = 'system'",
    [admin.id]
  );
  const declineNotification = rows.find((r) => r.order_id === order.id);
  assert.ok(declineNotification);
});

test("decline on a non-quoted order returns 409", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const customerAuth = `Bearer ${signToken(customer)}`;
  const created = await request(app).post("/orders").set("Authorization", customerAuth).send({ garmentType: "shirt" });

  const res = await request(app).post(`/orders/${created.body.id}/decline`).set("Authorization", customerAuth);
  assert.equal(res.status, 409);
});
