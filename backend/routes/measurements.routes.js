import { Router } from "express";
import { getMyMeasurements, putMyMeasurements } from "../controllers/measurements.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.get("/me/measurements", requireAuth, asyncHandler(getMyMeasurements));
router.put("/me/measurements", requireAuth, asyncHandler(putMyMeasurements));

export default router;
