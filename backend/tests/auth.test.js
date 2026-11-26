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

const validSignupFields = {
  firstName: "Rafi",
  lastName: "Ahmed",
  password: "secret123",
  confirmPassword: "secret123",
  phone: "01712345678",
};

test("signup creates a customer and returns a token", async () => {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, email: "rafi@example.com" });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
});

test("signup sets name to first name and last name joined by a space", async () => {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, email: "joined@example.com" });
  assert.equal(res.body.user.name, "Rafi Ahmed");
  assert.equal(res.body.user.first_name, "Rafi");
  assert.equal(res.body.user.last_name, "Ahmed");
});

test("signup with an already-used email returns 409", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, email: "dup@example.com" });
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, firstName: "B", email: "dup@example.com" });
  assert.equal(res.status, 409);
});

test("signup without a phone returns 400", async () => {
  const { phone: _phone, ...rest } = validSignupFields;
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ ...rest, email: "no-phone@example.com" });
  assert.equal(res.status, 400);
});

test("signup with a phone that isn't 11 digits returns 400", async () => {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, email: "short-phone@example.com", phone: "12345" });
  assert.equal(res.status, 400);
});

test("signup with mismatched passwords returns 400 and creates no account", async () => {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, email: "mismatch@example.com", confirmPassword: "different1" });
  assert.equal(res.status, 400);
  const retry = await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, email: "mismatch@example.com" });
  assert.equal(retry.status, 201);
});

test("signup response includes the saved phone number", async () => {
  const res = await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, email: "phone-echo@example.com" });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.phone_number, "01712345678");
});

test("login with correct credentials returns a token", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, email: "login-ok@example.com" });
  const res = await request(app)
    .post("/api/auth/login")
    .send({ email: "login-ok@example.com", password: "secret123" });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test("login with the wrong password returns 401", async () => {
  await request(app)
    .post("/api/auth/signup")
    .send({ ...validSignupFields, email: "login-bad@example.com" });
  const res = await request(app)
    .post("/api/auth/login")
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
