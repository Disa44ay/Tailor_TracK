import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import { notFound } from "./middlewares/notFound.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use(healthRoutes);

app.use(notFound);
app.use(errorHandler);
