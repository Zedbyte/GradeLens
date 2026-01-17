import { Router } from "express";
import {
  uploadScan,
  getScans,
  getScanById
} from "../controllers/scan.controller.ts";
import { API_ROUTES } from "../constants/routes.ts";

const router = Router();

router.post(API_ROUTES.SCANS.BASE, uploadScan);
router.get(API_ROUTES.SCANS.BASE, getScans);
router.get(`${API_ROUTES.SCANS.BASE}/:scan_id`, getScanById);

export default router;