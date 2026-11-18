import { Router } from "express";
import { getReports } from "../controllers/reports.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.get("/admin/reports", requireAuth, requireAdmin, asyncHandler(getReports));

export default router;
