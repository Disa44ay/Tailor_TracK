import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcryptjs";
import { resetTables, testPool } from "./helpers/db.js";
import { signupCustomer } from "./helpers/api.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
  const hash = await bcrypt.hash("admin-pass", 4);
  await testPool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ('Shop Admin', 'admin@shop.test', $1, 'admin')`,
    [hash]
  );
});

test("POST /api/admin/login returns a token for the admin", async () => {
  const res = await request(app)
    .post("/api/admin/login")
    .send({ email: "admin@shop.test", password: "admin-pass" });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, "admin");
});

test("POST /api/admin/login with a wrong password returns 401", async () => {
  const res = await request(app)
    .post("/api/admin/login")
    .send({ email: "admin@shop.test", password: "nope" });
  assert.equal(res.status, 401);
});

test("POST /api/admin/login for an unknown email returns 401", async () => {
  const res = await request(app)
    .post("/api/admin/login")
    .send({ email: "nobody@shop.test", password: "admin-pass" });
  assert.equal(res.status, 401);
});

test("POST /api/admin/login with a correct customer password returns 403", async () => {
  await signupCustomer({ email: "cust-login@example.com", password: "cust-pass", confirmPassword: "cust-pass" });
  const res = await request(app)
    .post("/api/admin/login")
    .send({ email: "cust-login@example.com", password: "cust-pass" });
  assert.equal(res.status, 403);
});

test("admin routes reject a request with no token", async () => {
  const res = await request(app).get("/api/admin/customers");
  assert.equal(res.status, 401);
});

test("admin routes reject a customer token with 403", async () => {
  const { token } = await signupCustomer({ email: "cust-admin-route@example.com" });
  const res = await request(app)
    .get("/api/admin/customers")
    .set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 403);
});

test("GET /api/admin/customers lists customers with name and email", async () => {
  const { token: adminToken } = await (async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ email: "admin@shop.test", password: "admin-pass" });
    return { token: res.body.token };
  })();
  await signupCustomer({ email: "listed@example.com", firstName: "Lia", lastName: "Khan" });
  const res = await request(app)
    .get("/api/admin/customers")
    .set("Authorization", `Bearer ${adminToken}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.deepEqual(res.body[0], { name: "Lia Khan", email: "listed@example.com" });
});
