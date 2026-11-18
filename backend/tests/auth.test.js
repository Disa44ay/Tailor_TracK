import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables } from "./helpers/db.js";
import { app } from "../app.js";
import { signToken } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

beforeEach(async () => {
  await resetTables();
});

test("signup creates a customer and returns a token", async () => {
  const res = await request(app)
    .post("/auth/signup")
    .send({ name: "Rafi", email: "rafi@example.com", password: "secret123" });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
});

test("signup with an already-used email returns 409", async () => {
  await request(app)
    .post("/auth/signup")
    .send({ name: "A", email: "dup@example.com", password: "secret123" });
  const res = await request(app)
    .post("/auth/signup")
    .send({ name: "B", email: "dup@example.com", password: "secret123" });
  assert.equal(res.status, 409);
});

test("login with correct credentials returns a token", async () => {
  await request(app)
    .post("/auth/signup")
    .send({ name: "Rafi", email: "login-ok@example.com", password: "secret123" });
  const res = await request(app)
    .post("/auth/login")
    .send({ email: "login-ok@example.com", password: "secret123" });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test("login with the wrong password returns 401", async () => {
  await request(app)
    .post("/auth/signup")
    .send({ name: "Rafi", email: "login-bad@example.com", password: "secret123" });
  const res = await request(app)
    .post("/auth/login")
    .send({ email: "login-bad@example.com", password: "wrongpassword" });
  assert.equal(res.status, 401);
});

test("requireAuth rejects a request with no Authorization header", () => {
  const req = { headers: {} };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
    },
  };
  let nextCalled = false;
  requireAuth(req, res, () => {
    nextCalled = true;
  });
  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("requireAuth accepts a valid token and sets req.user", () => {
  const token = signToken({ id: 1, role: "customer" });
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = {};
  let nextCalled = false;
  requireAuth(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.deepEqual(req.user, { id: 1, role: "customer" });
});

test("requireAdmin rejects a non-admin user", () => {
  const req = { user: { id: 1, role: "customer" } };
  const res = {
    statusCode: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json() {},
  };
  let nextCalled = false;
  requireAdmin(req, res, () => {
    nextCalled = true;
  });
  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});
