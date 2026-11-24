import { test } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { app } from "../app.js";

// SSLCommerz was archived, not deleted, 2026-11-24 (plan.md §5): the route
// file, controllers, and service all stay as they are, but app.js no
// longer mounts them, so every /payments/sslcommerz/* path (and the
// order-confirm/admin-payment routes alongside it) is unreachable.
test("payments routes are archived: GET /payments/sslcommerz/return 404s", async () => {
  const res = await request(app).get("/payments/sslcommerz/return").query({ orderId: "42" });
  assert.equal(res.status, 404);
});
