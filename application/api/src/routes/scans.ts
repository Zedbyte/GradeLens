import { Router } from "express";
import {
  uploadScan,
  getScans,
  getScanById
} from "../controllers/scan.controller.ts";

const router = Router();

router.post("/scans", uploadScan);
router.get("/scans", getScans);
router.get("/scans/:scan_id", getScanById);

export default router;
