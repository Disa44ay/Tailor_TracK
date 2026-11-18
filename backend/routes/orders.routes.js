import { Router } from "express";
import { createOrder, listMyOrders, getOrderById } from "../controllers/orders.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.post("/orders", requireAuth, asyncHandler(createOrder));
router.get("/orders", requireAuth, asyncHandler(listMyOrders));
router.get("/orders/:id", requireAuth, asyncHandler(getOrderById));

export default router;
