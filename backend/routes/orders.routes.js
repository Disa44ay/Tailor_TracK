import { Router } from "express";
import {
  createOrder,
  listMyOrders,
  getOrderById,
  rejectOrder,
  quoteOrder,
  listAllOrders,
} from "../controllers/orders.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.post("/orders", requireAuth, asyncHandler(createOrder));
router.get("/orders", requireAuth, asyncHandler(listMyOrders));
router.get("/orders/:id", requireAuth, asyncHandler(getOrderById));

router.get("/admin/orders", requireAuth, requireAdmin, asyncHandler(listAllOrders));
router.patch("/admin/orders/:id/reject", requireAuth, requireAdmin, asyncHandler(rejectOrder));
router.patch("/admin/orders/:id/quote", requireAuth, requireAdmin, asyncHandler(quoteOrder));

export default router;
