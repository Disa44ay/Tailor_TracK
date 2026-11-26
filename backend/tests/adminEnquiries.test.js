import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables } from "./helpers/db.js";
import { signupCustomer, createEnquiry, insertAdmin, adminToken } from "./helpers/api.js";
import { app } from "../app.js";

let admin;

beforeEach(async () => {
  await resetTables();
  await insertAdmin();
  admin = await adminToken();
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });

test("GET /api/admin/enquiries lists every customer's enquiries", async () => {
  const a = await signupCustomer({ email: "adm-list-a@example.com" });
  const b = await signupCustomer({ email: "adm-list-b@example.com" });
  await createEnquiry(a.token);
  await createEnquiry(b.token);
  const res = await request(app).get("/api/admin/enquiries").set(auth(admin));
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 2);
});

test("GET /api/admin/enquiries?status= filters by status", async () => {
  const a = await signupCustomer({ email: "adm-filter-a@example.com" });
  const b = await signupCustomer({ email: "adm-filter-b@example.com" });
  const first = await createEnquiry(a.token);
  await createEnquiry(b.token);
  await request(app)
    .post(`/api/admin/enquiries/${first.enquiry.id}/messages`)
    .set(auth(admin))
    .send({ kind: "message", body: "Hello" });

  const res = await request(app).get("/api/admin/enquiries?status=in_conversation").set(auth(admin));
  assert.equal(res.body.length, 1);
  assert.equal(res.body[0].id, first.enquiry.id);
});

test("GET /api/admin/enquiries with an unknown status returns 400", async () => {
  const res = await request(app).get("/api/admin/enquiries?status=paid").set(auth(admin));
  assert.equal(res.status, 400);
});

test("GET /api/admin/enquiries/:id returns the detail for any customer", async () => {
  const a = await signupCustomer({ email: "adm-detail@example.com" });
  const created = await createEnquiry(a.token);
  const res = await request(app)
    .get(`/api/admin/enquiries/${created.enquiry.id}`)
    .set(auth(admin));
  assert.equal(res.status, 200);
  assert.equal(res.body.items.length, 1);
});

test("GET /api/admin/enquiries/:id for a missing id returns 404", async () => {
  const res = await request(app).get("/api/admin/enquiries/999999").set(auth(admin));
  assert.equal(res.status, 404);
});

test("admin message sets the enquiry to in_conversation", async () => {
  const a = await signupCustomer({ email: "adm-msg@example.com" });
  const created = await createEnquiry(a.token);
  const res = await request(app)
    .post(`/api/admin/enquiries/${created.enquiry.id}/messages`)
    .set(auth(admin))
    .send({ kind: "message", body: "We can do navy cotton." });
  assert.equal(res.status, 201);
  assert.equal(res.body.sender, "admin");
  const detail = await request(app)
    .get(`/api/admin/enquiries/${created.enquiry.id}`)
    .set(auth(admin));
  assert.equal(detail.body.enquiry.status, "in_conversation");
});

test("admin can propose a date with a date_proposal", async () => {
  const a = await signupCustomer({ email: "adm-propose@example.com" });
  const created = await createEnquiry(a.token);
  const res = await request(app)
    .post(`/api/admin/enquiries/${created.enquiry.id}/messages`)
    .set(auth(admin))
    .send({ kind: "date_proposal", proposed_at: "2026-12-12T10:00:00Z" });
  assert.equal(res.status, 201);
  assert.equal(res.body.kind, "date_proposal");
});

test("admin cannot send a date_request", async () => {
  const a = await signupCustomer({ email: "adm-daterq@example.com" });
  const created = await createEnquiry(a.token);
  const res = await request(app)
    .post(`/api/admin/enquiries/${created.enquiry.id}/messages`)
    .set(auth(admin))
    .send({ kind: "date_request", proposed_at: "2026-12-12T10:00:00Z" });
  assert.equal(res.status, 400);
});

test("admin confirm sets status confirmed, the date, and an admin date_confirmed message", async () => {
  const a = await signupCustomer({ email: "adm-confirm@example.com" });
  const created = await createEnquiry(a.token);
  const res = await request(app)
    .post(`/api/admin/enquiries/${created.enquiry.id}/confirm`)
    .set(auth(admin))
    .send({ consultation_at: "2026-12-12T10:00:00Z" });
  assert.equal(res.status, 200);
  assert.equal(res.body.enquiry.status, "confirmed");
  const confirmed = res.body.messages.find((m) => m.kind === "date_confirmed");
  assert.equal(confirmed.sender, "admin");
});

test("admin confirm with an invalid date returns 400", async () => {
  const a = await signupCustomer({ email: "adm-baddate@example.com" });
  const created = await createEnquiry(a.token);
  const res = await request(app)
    .post(`/api/admin/enquiries/${created.enquiry.id}/confirm`)
    .set(auth(admin))
    .send({ consultation_at: "later" });
  assert.equal(res.status, 400);
});

test("admin confirm on a missing enquiry returns 404", async () => {
  const res = await request(app)
    .post("/api/admin/enquiries/999999/confirm")
    .set(auth(admin))
    .send({ consultation_at: "2026-12-12T10:00:00Z" });
  assert.equal(res.status, 404);
});

test("GET /api/admin/stats counts garments, fabrics and statuses", async () => {
  const a = await signupCustomer({ email: "adm-stats-a@example.com" });
  const b = await signupCustomer({ email: "adm-stats-b@example.com" });
  await createEnquiry(a.token, {
    items: [
      { garment: "shirt", fabricType: "Cotton", fabricColour: "Navy" },
      { garment: "suit", fabricType: "cotton ", fabricColour: "Grey" },
    ],
  });
  await createEnquiry(b.token, {
    items: [{ garment: "shirt", fabricType: "Linen", fabricColour: "White" }],
  });

  const res = await request(app).get("/api/admin/stats").set(auth(admin));
  assert.equal(res.status, 200);
  const garments = Object.fromEntries(res.body.by_garment.map((r) => [r.garment, r.count]));
  assert.deepEqual(garments, { shirt: 2, suit: 1 });
  const fabrics = Object.fromEntries(res.body.by_fabric_type.map((r) => [r.fabric_type, r.count]));
  assert.deepEqual(fabrics, { cotton: 2, linen: 1 });
  const statuses = Object.fromEntries(res.body.by_status.map((r) => [r.status, r.count]));
  assert.deepEqual(statuses, { sent: 2 });
});

test("GET /api/admin/stats needs an admin token", async () => {
  const a = await signupCustomer({ email: "adm-stats-auth@example.com" });
  const res = await request(app).get("/api/admin/stats").set(auth(a.token));
  assert.equal(res.status, 403);
});

test("confirmed enquiries move to archived once their time has passed", async () => {
  const a = await signupCustomer({ email: "adm-arch-a@example.com" });
  const past = await createEnquiry(a.token);
  const future = await createEnquiry(a.token);
  const pastAt = "2020-01-01T10:00:00.000Z";
  const futureAt = "2099-01-01T10:00:00.000Z";
  for (const [e, at] of [[past, pastAt], [future, futureAt]]) {
    await request(app)
      .post(`/api/admin/enquiries/${e.enquiry.id}/confirm`)
      .set(auth(admin))
      .send({ consultation_at: at });
  }

  const upcoming = await request(app).get("/api/admin/enquiries?status=confirmed").set(auth(admin));
  const archived = await request(app).get("/api/admin/enquiries?status=archived").set(auth(admin));
  assert.deepEqual(upcoming.body.map((r) => r.id), [future.enquiry.id]);
  assert.deepEqual(archived.body.map((r) => r.id), [past.enquiry.id]);
});

test("GET /api/admin/customers counts each customer's confirmed consultations", async () => {
  const a = await signupCustomer({ email: "adm-repeat-a@example.com" });
  const b = await signupCustomer({ email: "adm-repeat-b@example.com" });
  const e1 = await createEnquiry(a.token);
  const e2 = await createEnquiry(a.token);
  await createEnquiry(b.token);
  for (const e of [e1, e2]) {
    await request(app)
      .post(`/api/admin/enquiries/${e.enquiry.id}/confirm`)
      .set(auth(admin))
      .send({ consultation_at: "2099-01-01T10:00:00.000Z" });
  }

  const res = await request(app).get("/api/admin/customers").set(auth(admin));
  const byEmail = Object.fromEntries(res.body.map((c) => [c.email, c.consultations]));
  assert.equal(byEmail["adm-repeat-a@example.com"], 2);
  assert.equal(byEmail["adm-repeat-b@example.com"], 0);
});
