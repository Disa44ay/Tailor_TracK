import { Router } from "express";
import {
  adminLogin,
  listCustomers,
  listEnquiries,
  getEnquiry,
  postAdminMessage,
  confirmEnquiry,
  getStats,
} from "../controllers/admin.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

// Login comes first and always ends the request, so the guard below never sees it.
router.post("/admin/login", asyncHandler(adminLogin));

router.use("/admin", requireAuth, requireAdmin);
router.get("/admin/customers", asyncHandler(listCustomers));
router.get("/admin/enquiries", asyncHandler(listEnquiries));
router.get("/admin/enquiries/:id", asyncHandler(getEnquiry));
router.post("/admin/enquiries/:id/messages", asyncHandler(postAdminMessage));
router.post("/admin/enquiries/:id/confirm", asyncHandler(confirmEnquiry));
router.get("/admin/stats", asyncHandler(getStats));

export default router;
