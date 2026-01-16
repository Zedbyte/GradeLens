import express from "express";
import scansRouter from "./routes/scans.ts";
import healthRouter from "./routes/health.ts";
import { errorMiddleware } from "./middlewares/error.middleware.ts";
import cors from "cors";

const allowedOrigins = [
  "http://localhost:5173"
];

export function createApp() {
  const app = express();

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  }));

  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/api", scansRouter);

  app.use(errorMiddleware);

  return app;
}
