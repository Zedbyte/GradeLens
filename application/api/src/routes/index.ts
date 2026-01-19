import { Router } from "express";
import healthRoutes from "./health.ts";
import scanRoutes from "./scans.ts";
import authRoutes from "./auth.ts";
import studentRoutes from "./students.ts";
import classRoutes from "./classes.ts";
import quizRoutes from "./quizzes.ts";
import gradeRoutes from "./grades.ts";
import sectionRoutes from "./sections.ts";

const router = Router();

router.use(healthRoutes);
router.use(scanRoutes);
router.use(authRoutes);
router.use(studentRoutes);
router.use(classRoutes);
router.use(quizRoutes);
router.use(gradeRoutes);
router.use(sectionRoutes);

export default router;
