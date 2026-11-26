import { Router } from "express";
import {
  createEnquiry,
  listMyEnquiries,
  getMyEnquiry,
  markMyEnquirySeen,
  postMyMessage,
  confirmMyEnquiry,
} from "../controllers/enquiries.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";

const router = Router();

router.post("/enquiries", requireAuth, asyncHandler(createEnquiry));
router.get("/enquiries", requireAuth, asyncHandler(listMyEnquiries));
router.get("/enquiries/:id", requireAuth, asyncHandler(getMyEnquiry));
router.post("/enquiries/:id/seen", requireAuth, asyncHandler(markMyEnquirySeen));
router.post("/enquiries/:id/messages", requireAuth, asyncHandler(postMyMessage));
router.post("/enquiries/:id/confirm", requireAuth, asyncHandler(confirmMyEnquiry));

export default router;
