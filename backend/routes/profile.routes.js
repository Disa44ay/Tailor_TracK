import { Router } from "express";
import { getProfile, patchProfile } from "../controllers/profile.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.get("/me/profile", requireAuth, asyncHandler(getProfile));
router.patch("/me/profile", requireAuth, asyncHandler(patchProfile));

export default router;
