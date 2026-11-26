import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, testPool } from "./helpers/db.js";
import { signupCustomer, createEnquiry, insertAdmin, adminToken } from "./helpers/api.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });

test("POST /api/enquiries creates a sent enquiry with its items", async () => {
  const { token } = await signupCustomer({ email: "enq-create@example.com" });
  const res = await request(app)
    .post("/api/enquiries")
    .set(auth(token))
    .send({
      items: [
        { garment: "shirt", fabricType: "Cotton", fabricColour: "Navy" },
        { garment: "suit", fabricType: "Wool", fabricColour: "Charcoal" },
      ],
      height_cm: 175,
      weight_kg: 70,
      age: 28,
    });
  assert.equal(res.status, 201);
  assert.equal(res.body.enquiry.status, "sent");
  assert.equal(res.body.items.length, 2);
});

test("POST /api/enquiries stores the measurement snapshot and updates the profile", async () => {
  const { token } = await signupCustomer({ email: "enq-snapshot@example.com" });
  const body = await createEnquiry(token, { height_cm: 180.5, weight_kg: 75, age: 33 });
  assert.equal(body.enquiry.height_cm, 180.5);
  assert.equal(body.enquiry.age, 33);
  const profile = await request(app).get("/api/me/profile").set(auth(token));
  assert.equal(profile.body.height_cm, 180.5);
  assert.equal(profile.body.age, 33);
});

test("POST /api/enquiries lowercases and trims fabric type and colour", async () => {
  const { token } = await signupCustomer({ email: "enq-normalize@example.com" });
  const body = await createEnquiry(token, {
    items: [{ garment: "shirt", fabricType: "  Cotton ", fabricColour: "NAVY " }],
  });
  assert.equal(body.items[0].fabric_type, "cotton");
  assert.equal(body.items[0].fabric_colour, "navy");
});

test("POST /api/enquiries with an empty items list returns 400 and creates nothing", async () => {
  const { token } = await signupCustomer({ email: "enq-empty@example.com" });
  const res = await request(app).post("/api/enquiries").set(auth(token)).send({ items: [] });
  assert.equal(res.status, 400);
  const { rows } = await testPool.query("select count(*)::int as n from enquiries");
  assert.equal(rows[0].n, 0);
});

test("POST /api/enquiries with an unknown garment returns 400", async () => {
  const { token } = await signupCustomer({ email: "enq-garment@example.com" });
  const res = await request(app)
    .post("/api/enquiries")
    .set(auth(token))
    .send({ items: [{ garment: "kurta", fabricType: "Cotton", fabricColour: "Navy" }] });
  assert.equal(res.status, 400);
});

test("POST /api/enquiries with an out-of-range height returns 400", async () => {
  const { token } = await signupCustomer({ email: "enq-range@example.com" });
  const res = await request(app)
    .post("/api/enquiries")
    .set(auth(token))
    .send({
      items: [{ garment: "shirt", fabricType: "Cotton", fabricColour: "Navy" }],
      height_cm: 999,
    });
  assert.equal(res.status, 400);
});

test("GET /api/enquiries lists only the caller's enquiries", async () => {
  const mine = await signupCustomer({ email: "enq-list-mine@example.com" });
  const other = await signupCustomer({ email: "enq-list-other@example.com" });
  await createEnquiry(mine.token);
  await createEnquiry(other.token);
  const res = await request(app).get("/api/enquiries").set(auth(mine.token));
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].unread, false);
});

test("GET /api/enquiries marks an enquiry unread after an admin message, and /seen clears it", async () => {
  await insertAdmin();
  const { token } = await signupCustomer({ email: "enq-unread@example.com" });
  const created = await createEnquiry(token);
  const id = created.enquiry.id;
  const adminTok = await adminToken();
  await request(app)
    .post(`/api/admin/enquiries/${id}/messages`)
    .set(auth(adminTok))
    .send({ kind: "message", body: "We have your order" });

  let list = await request(app).get("/api/enquiries").set(auth(token));
  assert.equal(list.body[0].unread, true);

  const seen = await request(app).post(`/api/enquiries/${id}/seen`).set(auth(token));
  assert.equal(seen.status, 200);
  list = await request(app).get("/api/enquiries").set(auth(token));
  assert.equal(list.body[0].unread, false);
});

test("GET /api/enquiries/:id returns the enquiry, its items and its messages", async () => {
  const { token } = await signupCustomer({ email: "enq-detail@example.com" });
  const created = await createEnquiry(token);
  const res = await request(app).get(`/api/enquiries/${created.enquiry.id}`).set(auth(token));
  assert.equal(res.status, 200);
  assert.equal(res.body.enquiry.id, created.enquiry.id);
  assert.equal(res.body.items.length, 1);
  assert.deepEqual(res.body.messages, []);
});

test("another customer's enquiry returns 404 on every customer :id route", async () => {
  const owner = await signupCustomer({ email: "enq-owner@example.com" });
  const intruder = await signupCustomer({ email: "enq-intruder@example.com" });
  const created = await createEnquiry(owner.token);
  const id = created.enquiry.id;

  const get = await request(app).get(`/api/enquiries/${id}`).set(auth(intruder.token));
  const msg = await request(app)
    .post(`/api/enquiries/${id}/messages`)
    .set(auth(intruder.token))
    .send({ kind: "message", body: "hi" });
  const seen = await request(app).post(`/api/enquiries/${id}/seen`).set(auth(intruder.token));
  const confirm = await request(app)
    .post(`/api/enquiries/${id}/confirm`)
    .set(auth(intruder.token))
    .send({ consultation_at: "2026-12-01T10:00:00Z" });

  assert.equal(get.status, 404);
  assert.equal(msg.status, 404);
  assert.equal(seen.status, 404);
  assert.equal(confirm.status, 404);
});

test("a non-numeric enquiry id returns 404", async () => {
  const { token } = await signupCustomer({ email: "enq-badid@example.com" });
  const res = await request(app).get("/api/enquiries/abc").set(auth(token));
  assert.equal(res.status, 404);
});

test("customer message sets the enquiry to in_conversation", async () => {
  const { token } = await signupCustomer({ email: "enq-msg@example.com" });
  const created = await createEnquiry(token);
  const res = await request(app)
    .post(`/api/enquiries/${created.enquiry.id}/messages`)
    .set(auth(token))
    .send({ kind: "message", body: "Can we use a darker navy?" });
  assert.equal(res.status, 201);
  const detail = await request(app).get(`/api/enquiries/${created.enquiry.id}`).set(auth(token));
  assert.equal(detail.body.enquiry.status, "in_conversation");
  assert.equal(detail.body.messages[0].sender, "customer");
});

test("customer can ask for a different date with a date_request", async () => {
  const { token } = await signupCustomer({ email: "enq-daterq@example.com" });
  const created = await createEnquiry(token);
  const res = await request(app)
    .post(`/api/enquiries/${created.enquiry.id}/messages`)
    .set(auth(token))
    .send({ kind: "date_request", proposed_at: "2026-12-05T11:00:00Z" });
  assert.equal(res.status, 201);
  assert.equal(res.body.kind, "date_request");
});

test("customer cannot send a date_proposal", async () => {
  const { token } = await signupCustomer({ email: "enq-propose@example.com" });
  const created = await createEnquiry(token);
  const res = await request(app)
    .post(`/api/enquiries/${created.enquiry.id}/messages`)
    .set(auth(token))
    .send({ kind: "date_proposal", proposed_at: "2026-12-05T11:00:00Z" });
  assert.equal(res.status, 400);
});

test("customer message without a body returns 400", async () => {
  const { token } = await signupCustomer({ email: "enq-nobody@example.com" });
  const created = await createEnquiry(token);
  const res = await request(app)
    .post(`/api/enquiries/${created.enquiry.id}/messages`)
    .set(auth(token))
    .send({ kind: "message" });
  assert.equal(res.status, 400);
});

test("date_request without a valid proposed_at returns 400", async () => {
  const { token } = await signupCustomer({ email: "enq-nodate@example.com" });
  const created = await createEnquiry(token);
  const res = await request(app)
    .post(`/api/enquiries/${created.enquiry.id}/messages`)
    .set(auth(token))
    .send({ kind: "date_request", proposed_at: "not a date" });
  assert.equal(res.status, 400);
});

test("customer confirm sets status confirmed, the date, and writes a date_confirmed message", async () => {
  const { token } = await signupCustomer({ email: "enq-confirm@example.com" });
  const created = await createEnquiry(token);
  const res = await request(app)
    .post(`/api/enquiries/${created.enquiry.id}/confirm`)
    .set(auth(token))
    .send({ consultation_at: "2026-12-10T09:30:00Z" });
  assert.equal(res.status, 200);
  assert.equal(res.body.enquiry.status, "confirmed");
  assert.ok(res.body.enquiry.consultation_at);
  const confirmed = res.body.messages.find((m) => m.kind === "date_confirmed");
  assert.ok(confirmed);
  assert.equal(confirmed.sender, "customer");
});

test("customer confirm with an invalid date returns 400", async () => {
  const { token } = await signupCustomer({ email: "enq-baddate@example.com" });
  const created = await createEnquiry(token);
  const res = await request(app)
    .post(`/api/enquiries/${created.enquiry.id}/confirm`)
    .set(auth(token))
    .send({ consultation_at: "soon" });
  assert.equal(res.status, 400);
});

test("GET /api/enquiries lists garments and the latest requested date", async () => {
  const { token } = await signupCustomer({ email: "enq-list-fields@example.com" });
  const created = await createEnquiry(token);
  await request(app)
    .post(`/api/enquiries/${created.enquiry.id}/messages`)
    .set(auth(token))
    .send({ kind: "date_request", proposed_at: "2099-05-01T09:00:00.000Z" });

  const res = await request(app).get("/api/enquiries").set(auth(token));
  assert.equal(res.body[0].garments, "shirt");
  assert.equal(new Date(res.body[0].requested_at).toISOString(), "2099-05-01T09:00:00.000Z");
});

test("POST /api/enquiries refuses the studio admin account", async () => {
  await insertAdmin();
  const admin = await adminToken();
  const res = await request(app)
    .post("/api/enquiries")
    .set(auth(admin))
    .send({ items: [{ garment: "shirt", fabricType: "Cotton", fabricColour: "Navy" }], height_cm: 175, weight_kg: 70, age: 28 });
  assert.equal(res.status, 403);
});
