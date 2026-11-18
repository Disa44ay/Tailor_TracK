import { test } from "node:test";
import assert from "node:assert/strict";
import { buildInitPayload } from "../services/sslcommerz.service.js";

test("buildInitPayload points success/fail/cancel at the frontend return route, and ipn at the JSON callback", () => {
  const payload = buildInitPayload({
    order: { id: 7, advance_required: 500 },
    customer: { name: "Rafi", email: "rafi@example.com", phone_number: "01700000000" },
    tranId: "tt-7-abc",
    baseUrl: "https://api.example.com",
  });

  assert.equal(payload.success_url, "https://api.example.com/payments/sslcommerz/return?orderId=7");
  assert.equal(payload.fail_url, "https://api.example.com/payments/sslcommerz/return?orderId=7");
  assert.equal(payload.cancel_url, "https://api.example.com/payments/sslcommerz/return?orderId=7");
  assert.equal(payload.ipn_url, "https://api.example.com/payments/sslcommerz/callback");
});
