import { Router } from "express";
import { ReportController } from "../controllers/report.controller.ts";

const router = Router();

router.get("/reports/pl-entries", ReportController.getPLEntries);
router.get("/reports/item-entries", ReportController.getItemEntries);

export default router;
