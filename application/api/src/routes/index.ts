import { Router } from "express";
import healthRoutes from "./health.ts";
import scanRoutes from "./scans.ts";
import authRoutes from "./auth.ts";

const router = Router();

router.use(healthRoutes);
router.use(scanRoutes);
router.use(authRoutes);

export default router;
