import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, insertTestUser } from "./helpers/db.js";
import { signToken } from "../controllers/auth.controller.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

test("GET /me/measurements returns null fields before any PUT", async () => {
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .get("/me/measurements")
    .set("Authorization", `Bearer ${signToken(customer)}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.chest, null);
  assert.equal(res.body.waist, null);
});

test("PUT /me/measurements upserts the seven fields and GET then reflects them", async () => {
  const customer = await insertTestUser({ role: "customer" });
  const auth = `Bearer ${signToken(customer)}`;
  const values = {
    chest: 40,
    waist: 34,
    hip: 38,
    shoulderWidth: 18,
    sleeveLength: 24,
    inseam: 32,
    neck: 15.5,
  };

  const putRes = await request(app).put("/me/measurements").set("Authorization", auth).send(values);
  assert.equal(putRes.status, 200);
  assert.equal(putRes.body.chest, 40);

  const getRes = await request(app).get("/me/measurements").set("Authorization", auth);
  assert.equal(getRes.status, 200);
  assert.equal(getRes.body.chest, 40);
  assert.equal(getRes.body.neck, 15.5);

  // upsert again (update, not duplicate)
  const secondPut = await request(app)
    .put("/me/measurements")
    .set("Authorization", auth)
    .send({ ...values, chest: 42 });
  assert.equal(secondPut.status, 200);
  assert.equal(secondPut.body.chest, 42);
});

test("PUT with a non-numeric value for a field returns 400", async () => {
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .put("/me/measurements")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ chest: "abc" });
  assert.equal(res.status, 400);
});
