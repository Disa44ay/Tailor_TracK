import { Router } from "express";
import { signup, login } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.post("/auth/signup", asyncHandler(signup));
router.post("/auth/login", asyncHandler(login));

export default router;
