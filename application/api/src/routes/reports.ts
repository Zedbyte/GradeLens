import { Router } from "express";
import { ReportController } from "../controllers/report.controller.ts";

const router = Router();

router.get("/reports/quiz-statistics", ReportController.listQuizStatistics);

export default router;
