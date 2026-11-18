import { Router } from "express";
import {
  confirmOrder,
  sslcommerzCallback,
  sslcommerzReturn,
  recordBalancePayment,
} from "../controllers/payments.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.post("/orders/:id/confirm", requireAuth, asyncHandler(confirmOrder));
router.post("/payments/sslcommerz/callback", asyncHandler(sslcommerzCallback));
// SSLCommerz's hosted page redirects the browser here via a form POST
// (sometimes a GET) after checkout — support both.
router.post("/payments/sslcommerz/return", sslcommerzReturn);
router.get("/payments/sslcommerz/return", sslcommerzReturn);
router.post(
  "/admin/orders/:id/payments",
  requireAuth,
  requireAdmin,
  asyncHandler(recordBalancePayment)
);

export default router;
