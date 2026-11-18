import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import measurementsRoutes from "./routes/measurements.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use(healthRoutes);
app.use(authRoutes);
app.use(notificationsRoutes);
app.use(measurementsRoutes);
app.use(ordersRoutes);
app.use(reportsRoutes);

app.use(notFound);
app.use(errorHandler);
