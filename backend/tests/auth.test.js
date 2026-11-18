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
  name: "Rafi",
  password: "secret123",
  countryCode: "+880",
  phoneNumber: "01712345678",
};

test("signup creates a customer and returns a token", async () => {
  const res = await request(app)
    .post("/auth/signup")
    .send({ ...validSignupFields, email: "rafi@example.com" });
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
});

test("signup with an already-used email returns 409", async () => {
  await request(app)
    .post("/auth/signup")
    .send({ ...validSignupFields, email: "dup@example.com" });
  const res = await request(app)
    .post("/auth/signup")
    .send({ ...validSignupFields, name: "B", email: "dup@example.com" });
  assert.equal(res.status, 409);
});

test("signup without a phone number returns 400", async () => {
  const { phoneNumber, ...rest } = validSignupFields;
  const res = await request(app)
    .post("/auth/signup")
    .send({ ...rest, email: "no-phone@example.com" });
  assert.equal(res.status, 400);
});

test("signup with a phone number that isn't 11 digits returns 400", async () => {
  const res = await request(app)
    .post("/auth/signup")
    .send({ ...validSignupFields, email: "short-phone@example.com", phoneNumber: "12345" });
  assert.equal(res.status, 400);
});

test("signup with a country code not in the known list returns 400", async () => {
  const res = await request(app)
    .post("/auth/signup")
    .send({ ...validSignupFields, email: "bad-code@example.com", countryCode: "+999" });
  assert.equal(res.status, 400);
});

test("signup response includes the saved country code and phone number", async () => {
  const res = await request(app)
    .post("/auth/signup")
    .send({ ...validSignupFields, email: "phone-echo@example.com" });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.country_code, "+880");
  assert.equal(res.body.user.phone_number, "01712345678");
});

test("login with correct credentials returns a token", async () => {
  await request(app)
    .post("/auth/signup")
    .send({ ...validSignupFields, email: "login-ok@example.com" });
  const res = await request(app)
    .post("/auth/login")
    .send({ email: "login-ok@example.com", password: "secret123" });
  assert.equal(res.status, 200);
  assert.ok(res.body.token);
});

test("login with the wrong password returns 401", async () => {
  await request(app)
    .post("/auth/signup")
    .send({ ...validSignupFields, email: "login-bad@example.com" });
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
