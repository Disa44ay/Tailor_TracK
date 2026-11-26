import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../app.js";
import { testPool } from "./db.js";

export const ADMIN_EMAIL = "admin@shop.test";
export const ADMIN_PASSWORD = "admin-pass";

export async function insertAdmin() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 4);
  await testPool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES ('Shop Admin', $1, $2, 'admin')`,
    [ADMIN_EMAIL, hash]
  );
}

export async function adminToken() {
  const res = await request(app).post("/api/admin/login").send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
  return res.body.token;
}

// Creates an enquiry through the real endpoint; returns the detail body ({ enquiry, items, messages }).
export async function createEnquiry(token, overrides = {}) {
  const body = {
    items: [{ garment: "shirt", fabricType: "Cotton", fabricColour: "Navy" }],
    height_cm: 175,
    weight_kg: 70,
    age: 28,
    ...overrides,
  };
  const res = await request(app)
    .post("/api/enquiries")
    .set("Authorization", `Bearer ${token}`)
    .send(body);
  if (res.status !== 201) throw new Error(`createEnquiry failed: ${res.status} ${res.text}`);
  return res.body;
}

let emailCounter = 0;

// Signs up a customer through the real endpoint and returns the token and user.
export async function signupCustomer(overrides = {}) {
  emailCounter += 1;
  const fields = {
    firstName: "Rafi",
    lastName: "Ahmed",
    password: "secret123",
    confirmPassword: "secret123",
    phone: "01712345678",
    email: `customer-${emailCounter}@example.com`,
    ...overrides,
  };
  const res = await request(app).post("/api/auth/signup").send(fields);
  if (res.status !== 201) throw new Error(`signup failed: ${res.status} ${res.text}`);
  return { token: res.body.token, user: res.body.user, email: fields.email };
}
