import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import measurementsRoutes from "./routes/measurements.routes.js";
import fabricsRoutes from "./routes/fabrics.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
// paymentsRoutes archived 2026-11-24 (plan.md §5) — the advance-payment/
// SSLCommerz gate was removed from the order flow (see acceptOrder in
// orders.controller.js). Left commented out rather than deleted: the
// service, controllers, and route file are untouched, so reactivating
// this is just uncommenting the import and the app.use below.
// import paymentsRoutes from "./routes/payments.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
// SSLCommerz posts its callback as form-encoded, not JSON.
app.use(express.urlencoded({ extended: true }));

app.use(healthRoutes);
app.use(authRoutes);
app.use(notificationsRoutes);
app.use(measurementsRoutes);
app.use(fabricsRoutes);
app.use(ordersRoutes);
// app.use(paymentsRoutes); — archived, see the import comment above.
app.use(reportsRoutes);

app.use(notFound);
app.use(errorHandler);
