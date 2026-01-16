import express from "express";
import scansRouter from "./routes/scans.ts";
import healthRouter from "./routes/health.ts";
import { errorMiddleware } from "./middlewares/error.middleware.ts";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/api", scansRouter);

  app.use(errorMiddleware);

  return app;
}
