import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import enquiryRoutes from "./routes/enquiries.routes.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use(healthRoutes);
// Everything the frontend calls lives under /api, per the API contract.
app.use("/api", authRoutes);
app.use("/api", profileRoutes);
app.use("/api", adminRoutes);
app.use("/api", enquiryRoutes);

app.use(notFound);
app.use(errorHandler);
