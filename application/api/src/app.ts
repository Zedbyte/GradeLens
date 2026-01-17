import express from "express";
import routes from "./routes/index.ts";
import healthRouter from "./routes/health.ts";
import { errorMiddleware } from "./middlewares/error.middleware.ts";
import cors from "cors";

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim());

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

  // Debug: log all requests
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  app.use("/api", routes);

  app.use(errorMiddleware);

  return app;
}