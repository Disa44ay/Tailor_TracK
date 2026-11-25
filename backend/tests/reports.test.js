import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { resetTables, insertTestUser, testPool } from "./helpers/db.js";
import { signToken } from "../controllers/auth.controller.js";
import { app } from "../app.js";

beforeEach(async () => {
  await resetTables();
});

// quoteOrder was removed 2026-11-24 (plan.md §5) — "quoted" is still a
// valid status, just no longer reachable via any live endpoint, so this
// fixture sets it directly to keep exercising the report's per-status count.
async function createQuotedOrder(adminAuth, customerAuth, quotedPrice) {
  const created = await request(app).post("/orders").set("Authorization", customerAuth).send({ garmentType: "shirt" });
  await testPool.query(
    `UPDATE orders SET status = 'quoted', due_date = '2026-12-01', quoted_price = $2, advance_required = $3
     WHERE id = $1`,
    [created.body.id, quotedPrice, Math.min(500, quotedPrice)]
  );
  return created.body.id;
}

test("GET /admin/reports returns order counts per status and payment totals", async () => {
  const admin = await insertTestUser({ role: "admin" });
  const customer = await insertTestUser({ role: "customer" });
  const adminAuth = `Bearer ${signToken(admin)}`;
  const customerAuth = `Bearer ${signToken(customer)}`;

  const order1 = await createQuotedOrder(adminAuth, customerAuth, 1000);
  const order2 = await createQuotedOrder(adminAuth, customerAuth, 2000);

  await testPool.query(
    `INSERT INTO payments (order_id, type, amount) VALUES ($1, 'advance', 300)`,
    [order1]
  );
  await testPool.query(
    `INSERT INTO payments (order_id, type, amount) VALUES ($1, 'advance', 500), ($1, 'balance', 200)`,
    [order2]
  );

  const res = await request(app).get("/admin/reports").set("Authorization", adminAuth);
  assert.equal(res.status, 200);
  assert.equal(res.body.ordersByStatus.quoted, 2);
  assert.equal(res.body.totals.collected, 1000); // 300 + 500 + 200
  assert.equal(res.body.totals.outstanding, 2000); // (1000-300) + (2000-700)
});

test("GET /admin/reports is admin-only", async () => {
  const customer = await insertTestUser({ role: "customer" });
  const res = await request(app).get("/admin/reports").set("Authorization", `Bearer ${signToken(customer)}`);
  assert.equal(res.status, 403);
});
