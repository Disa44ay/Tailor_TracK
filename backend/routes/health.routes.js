import { Router } from "express";
import { getHealth, getHealthDb } from "../controllers/health.controller.js";

const router = Router();

router.get("/health", getHealth);
router.get("/health/db", getHealthDb);

export default router;
