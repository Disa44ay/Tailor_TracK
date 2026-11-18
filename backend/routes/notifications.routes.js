import { Router } from "express";
import {
  getMyNotifications,
  markNotificationRead,
  sendCustomNotification,
} from "../controllers/notifications.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.get("/me/notifications", requireAuth, asyncHandler(getMyNotifications));
router.patch("/me/notifications/:id", requireAuth, asyncHandler(markNotificationRead));
router.post(
  "/admin/notifications",
  requireAuth,
  requireAdmin,
  asyncHandler(sendCustomNotification)
);

export default router;
