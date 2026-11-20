import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, insertTestUser, testPool } from "./helpers/db.js";
import { signToken } from "../controllers/auth.controller.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

async function insertFabric({
  name = "Navy Cotton",
  colorHex = "#1b2a4a",
  texture = "cotton",
  isActive = true,
} = {}) {
  await testPool.query(
    `INSERT INTO fabrics (name, color_hex, texture, is_active) VALUES ($1, $2, $3, $4)`,
    [name, colorHex, texture, isActive]
  );
}

test("GET /fabrics returns only active fabrics, ordered by name", async () => {
  const customer = await insertTestUser({ role: "customer" });
  await insertFabric({ name: "Navy Cotton" });
  await insertFabric({ name: "Discontinued Silk", texture: "silk", isActive: false });

  const res = await request(app)
    .get("/fabrics")
    .set("Authorization", `Bearer ${signToken(customer)}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].name, "Navy Cotton");
  assert.equal(res.body[0].color_hex, "#1b2a4a");
});

test("GET /fabrics without auth returns 401", async () => {
  const res = await request(app).get("/fabrics");
  assert.equal(res.status, 401);
});
