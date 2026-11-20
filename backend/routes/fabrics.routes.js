import { Router } from "express";
import { getFabrics } from "../controllers/fabrics.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.get("/fabrics", requireAuth, asyncHandler(getFabrics));

export default router;
