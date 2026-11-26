import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables } from "./helpers/db.js";
import { signupCustomer, createEnquiry } from "./helpers/api.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });

test("POST /api/enquiries without a token returns 401", async () => {
  const res = await request(app)
    .post("/api/enquiries")
    .send({ items: [{ garment: "shirt", fabricType: "Cotton", fabricColour: "Navy" }], height_cm: 175, weight_kg: 70, age: 28 });
  assert.equal(res.status, 401);
});

test("another customer cannot confirm an enquiry they do not own", async () => {
  const owner = await signupCustomer({ email: "guard-owner@example.com" });
  const other = await signupCustomer({ email: "guard-other@example.com" });
  const enquiry = await createEnquiry(owner.token);
  const res = await request(app)
    .post(`/api/enquiries/${enquiry.enquiry.id}/confirm`)
    .set(auth(other.token))
    .send({ consultation_at: "2099-01-01T10:00:00.000Z" });
  assert.equal(res.status, 404);
});

test("another customer cannot mark an enquiry they do not own as seen", async () => {
  const owner = await signupCustomer({ email: "guard-seen-owner@example.com" });
  const other = await signupCustomer({ email: "guard-seen-other@example.com" });
  const enquiry = await createEnquiry(owner.token);
  const res = await request(app)
    .post(`/api/enquiries/${enquiry.enquiry.id}/seen`)
    .set(auth(other.token));
  assert.equal(res.status, 404);
});

test("GET /health reports the service is up", async () => {
  const res = await request(app).get("/health");
  assert.equal(res.status, 200);
});
