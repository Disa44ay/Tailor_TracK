import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, insertTestUser } from "./helpers/db.js";
import { notify } from "../services/notifications.service.js";
import { signToken } from "../controllers/auth.controller.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

test("notify() inserts a notification row", async () => {
  const user = await insertTestUser({ role: "customer" });
  const n = await notify({ sender: "system", recipientId: user.id, message: "hello" });
  assert.equal(n.is_read, false);
  assert.equal(n.message, "hello");
});

test("GET /me/notifications returns only the caller's notifications", async () => {
  const alice = await insertTestUser({ role: "customer" });
  const bob = await insertTestUser({ role: "customer" });
  await notify({ sender: "system", recipientId: alice.id, message: "for alice" });
  await notify({ sender: "system", recipientId: bob.id, message: "for bob" });

  const res = await request(app)
    .get("/me/notifications")
    .set("Authorization", `Bearer ${signToken(alice)}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].message, "for alice");
});

test("PATCH /me/notifications/:id marks it read, and rejects marking someone else's", async () => {
  const alice = await insertTestUser({ role: "customer" });
  const bob = await insertTestUser({ role: "customer" });
  const n = await notify({ sender: "system", recipientId: alice.id, message: "for alice" });

  const bobTriesAlice = await request(app)
    .patch(`/me/notifications/${n.id}`)
    .set("Authorization", `Bearer ${signToken(bob)}`);
  assert.equal(bobTriesAlice.status, 404);

  const aliceMarksHerOwn = await request(app)
    .patch(`/me/notifications/${n.id}`)
    .set("Authorization", `Bearer ${signToken(alice)}`);
  assert.equal(aliceMarksHerOwn.status, 200);
  assert.equal(aliceMarksHerOwn.body.is_read, true);
});

test("POST /admin/notifications sends a custom message to a given customer, admin-only", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });

  const forbidden = await request(app)
    .post("/admin/notifications")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ customerId: customer.id, message: "should not work" });
  assert.equal(forbidden.status, 403);

  const res = await request(app)
    .post("/admin/notifications")
    .set("Authorization", `Bearer ${signToken(admin)}`)
    .send({ customerId: customer.id, message: "the fabric isn't available" });
  assert.equal(res.status, 201);
  assert.equal(res.body.sender, "admin");
  assert.equal(res.body.recipient_id, customer.id);
});
