import { Router } from "express";
import healthRoutes from "./health.ts";
import scanRoutes from "./scans.ts";
import authRoutes from "./auth.ts";
import studentRoutes from "./students.ts";
import classRoutes from "./classes.ts";
import quizRoutes from "./quizzes.ts";

const router = Router();

router.use(healthRoutes);
router.use(scanRoutes);
router.use(authRoutes);
router.use(studentRoutes);
router.use(classRoutes);
router.use(quizRoutes);

export default router;
