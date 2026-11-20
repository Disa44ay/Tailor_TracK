import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, insertTestUser, testPool } from "./helpers/db.js";
import { signToken } from "../controllers/auth.controller.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

async function makeAdmin() {
  return insertTestUser({ role: "admin" });
}

test("POST /orders creates a requested order and snapshots current measurements", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const auth = `Bearer ${signToken(customer)}`;

  await request(app).put("/me/measurements").set("Authorization", auth).send({ chest: 40, waist: 34 });

  const res = await request(app)
    .post("/orders")
    .set("Authorization", auth)
    .send({ garmentType: "shirt", styleNotes: "slim fit" });

  assert.equal(res.status, 201);
  assert.equal(res.body.status, "requested");
  assert.equal(res.body.measurements_snapshot.chest, 40);
  assert.equal(res.body.measurements_snapshot.waist, 34);
});

test("POST /orders with an invalid garment_type returns 400", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ garmentType: "tuxedo" });
  assert.equal(res.status, 400);
});

test("POST /orders with garment_type 'other' requires a non-empty note", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const auth = `Bearer ${signToken(customer)}`;

  const missingNote = await request(app)
    .post("/orders")
    .set("Authorization", auth)
    .send({ garmentType: "other" });
  assert.equal(missingNote.status, 400);

  const withNote = await request(app)
    .post("/orders")
    .set("Authorization", auth)
    .send({ garmentType: "other", styleNotes: "a custom vest" });
  assert.equal(withNote.status, 201);
});

test("GET /orders returns only the caller's own orders", async () => {
  await makeAdmin();
  const alice = await insertTestUser({ role: "customer" });
  const bob = await insertTestUser({ role: "customer" });
  await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(alice)}`)
    .send({ garmentType: "shirt" });
  await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(bob)}`)
    .send({ garmentType: "pant" });

  const res = await request(app).get("/orders").set("Authorization", `Bearer ${signToken(alice)}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].garment_type, "shirt");
});

test("GET /orders/:id on someone else's order returns 404", async () => {
  await makeAdmin();
  const alice = await insertTestUser({ role: "customer" });
  const bob = await insertTestUser({ role: "customer" });
  const created = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(alice)}`)
    .send({ garmentType: "shirt" });

  const res = await request(app)
    .get(`/orders/${created.body.id}`)
    .set("Authorization", `Bearer ${signToken(bob)}`);
  assert.equal(res.status, 404);
});

test("POST /orders notifies the admin", async () => {
  const admin = await makeAdmin();
  const customer = await insertTestUser({ role: "customer", name: "Rafi" });
  await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ garmentType: "shirt" });

  const { rows } = await testPool.query(
    "SELECT * FROM notifications WHERE recipient_id = $1 AND sender = 'system'",
    [admin.id]
  );
  assert.equal(rows.length, 1);
  assert.match(rows[0].message, /Rafi/);
});

test("POST /orders accepts a valid fit_type for the garment and a lapel_style", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const auth = `Bearer ${signToken(customer)}`;

  const res = await request(app)
    .post("/orders")
    .set("Authorization", auth)
    .send({ garmentType: "suit_2pc", fitType: "english_structured", lapelStyle: "peak" });

  assert.equal(res.status, 201);
  assert.equal(res.body.fit_type, "english_structured");
  assert.equal(res.body.lapel_style, "peak");
});

test("POST /orders with a fit_type not valid for that garment returns 400", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    // "bootcut" is a pant fit_type, not a shirt one
    .send({ garmentType: "shirt", fitType: "bootcut" });
  assert.equal(res.status, 400);
});

test("POST /orders with an unrecognized lapel_style returns 400", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ garmentType: "suit_2pc", lapelStyle: "wide" });
  assert.equal(res.status, 400);
});

test("POST /orders accepts a fabricId and snapshots the body profile", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const auth = `Bearer ${signToken(customer)}`;

  await request(app)
    .put("/me/measurements")
    .set("Authorization", auth)
    .send({ heightCm: 175, weightKg: 70, age: 28 });

  const fabric = await testPool.query(
    `INSERT INTO fabrics (name, color_hex, texture) VALUES ('Navy Cotton', '#1b2a4a', 'cotton') RETURNING id`
  );
  const fabricId = fabric.rows[0].id;

  const res = await request(app)
    .post("/orders")
    .set("Authorization", auth)
    .send({ garmentType: "shirt", fabricId });

  assert.equal(res.status, 201);
  assert.equal(res.body.fabric_id, fabricId);
  assert.equal(res.body.body_profile_snapshot.height_cm, 175);
  assert.equal(res.body.body_profile_snapshot.age, 28);
});

test("POST /orders with no measurements on file snapshots a null body profile", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ garmentType: "shirt" });
  assert.equal(res.status, 201);
  assert.equal(res.body.body_profile_snapshot, null);
});

test("POST /orders with an unrecognized or inactive fabricId returns 400", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ garmentType: "shirt", fabricId: 999999 });
  assert.equal(res.status, 400);
});

test("POST /orders with a non-numeric fabricId returns 400", async () => {
  await makeAdmin();
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app)
    .post("/orders")
    .set("Authorization", `Bearer ${signToken(customer)}`)
    .send({ garmentType: "shirt", fabricId: "navy" });
  assert.equal(res.status, 400);
});
