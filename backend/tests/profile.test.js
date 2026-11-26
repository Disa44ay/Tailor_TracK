import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables } from "./helpers/db.js";
import { signupCustomer } from "./helpers/api.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

test("GET /api/me/profile returns names, measurements, email and phone", async () => {
  const { token, email } = await signupCustomer({ email: "profile-get@example.com" });
  const res = await request(app).get("/api/me/profile").set("Authorization", `Bearer ${token}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.first_name, "Rafi");
  assert.equal(res.body.last_name, "Ahmed");
  assert.equal(res.body.email, email);
  assert.equal(res.body.phone, "01712345678");
  assert.equal(res.body.height_cm, null);
});

test("GET /api/me/profile without a token returns 401", async () => {
  const res = await request(app).get("/api/me/profile");
  assert.equal(res.status, 401);
});

test("PATCH /api/me/profile saves height, weight and age as numbers", async () => {
  const { token } = await signupCustomer({ email: "profile-patch@example.com" });
  const res = await request(app)
    .patch("/api/me/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ height_cm: 170.5, weight_kg: 68, age: 30 });
  assert.equal(res.status, 200);
  assert.equal(res.body.height_cm, 170.5);
  assert.equal(res.body.weight_kg, 68);
  assert.equal(res.body.age, 30);
});

test("PATCH /api/me/profile with a missing field keeps the saved value", async () => {
  const { token } = await signupCustomer({ email: "profile-keep@example.com" });
  await request(app)
    .patch("/api/me/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ height_cm: 170, weight_kg: 68, age: 30 });
  const res = await request(app)
    .patch("/api/me/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ age: 31 });
  assert.equal(res.body.height_cm, 170);
  assert.equal(res.body.age, 31);
});

test("PATCH /api/me/profile rejects an out-of-range height with 400", async () => {
  const { token } = await signupCustomer({ email: "profile-range@example.com" });
  const res = await request(app)
    .patch("/api/me/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ height_cm: 300 });
  assert.equal(res.status, 400);
});

test("PATCH /api/me/profile rejects a fractional age with 400", async () => {
  const { token } = await signupCustomer({ email: "profile-age@example.com" });
  const res = await request(app)
    .patch("/api/me/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ age: 30.5 });
  assert.equal(res.status, 400);
});

test("PATCH /api/me/profile rejects a non-number weight with 400", async () => {
  const { token } = await signupCustomer({ email: "profile-type@example.com" });
  const res = await request(app)
    .patch("/api/me/profile")
    .set("Authorization", `Bearer ${token}`)
    .send({ weight_kg: "heavy" });
  assert.equal(res.status, 400);
});
