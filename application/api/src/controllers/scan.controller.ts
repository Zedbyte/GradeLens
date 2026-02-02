import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";
import { createScan, listScans, getScan, updateScanAnswers, markScanAsReviewed } from "../services/scan.service.ts";

const STORAGE_DIR = process.env.SCAN_STORAGE_DIR || "/data/scans";

if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

export async function uploadScan(req: Request, res: Response) {
  try {
    const { image, exam_id, student_id } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }
    if (!exam_id) {
      return res.status(400).json({ error: "exam_id is required" });
    }
    if (!student_id) {
      return res.status(400).json({ error: "student_id is required" });
    }

    const scan_id = uuid();
    const filename = `${scan_id}.jpg`;
    const filePath = path.join(STORAGE_DIR, filename);

    fs.writeFileSync(filePath, image, "base64");

    const scan = await createScan(scan_id, filename, exam_id, student_id);

    res.status(202).json(scan);
  } catch (error) {
    console.error("Upload scan error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to upload scan" 
    });
  }
}

/**
 * Upload answer key scan (no exam_id or student_id required)
 * Used for scanning answer keys before exam creation
 */
export async function uploadAnswerKeyScan(req: Request, res: Response) {
  try {
    const { image, template_id } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Image is required" });
    }
    if (!template_id) {
      return res.status(400).json({ error: "template_id is required" });
    }

    const scan_id = uuid();
    const filename = `${scan_id}.jpg`;
    const filePath = path.join(STORAGE_DIR, filename);

    fs.writeFileSync(filePath, image, "base64");

    const scan = await createScan(scan_id, filename, null, null, template_id);

    res.status(202).json(scan);
  } catch (error) {
    console.error("Upload answer key scan error:", error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to upload answer key scan" 
    });
  }
}

export async function getScans(req: Request, res: Response) {
  res.json(await listScans());
}

export async function getScanById(req: Request, res: Response) {
  const scan_id = Array.isArray(req.params.scan_id) ? req.params.scan_id[0] : req.params.scan_id;
  const scan = await getScan(scan_id);
  if (!scan) return res.sendStatus(404);
  res.json(scan);
}

export async function updateScanAnswersController(req: Request, res: Response) {
  try {
    const scan_id = Array.isArray(req.params.scan_id) ? req.params.scan_id[0] : req.params.scan_id;
    const { answers } = req.body;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({ error: "answers is required and must be an object" });
    }

    // Get user ID from authenticated request
    const user_id = (req as any).user?.id || (req as any).user?._id || "unknown";

    const scan = await updateScanAnswers(scan_id, answers, user_id);

    res.json({
      scan_id: scan.scan_id,
      status: scan.status,
      graded_by: scan.graded_by,
      graded_at: scan.graded_at
    });
  } catch (error) {
    console.error("Update scan answers error:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    if (error instanceof Error && error.message.includes("cannot be edited")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to update scan answers" 
    });
  }
}

// review_notes is optional, it is not being passed from the frontend currently. (01-27-26)
export async function markAsReviewedController(req: Request, res: Response) {
  try {
    const scan_id = Array.isArray(req.params.scan_id) ? req.params.scan_id[0] : req.params.scan_id;
    const { review_notes } = req.body;

    // Get user ID from authenticated request
    const user_id = (req as any).user?.id || (req as any).user?._id || "unknown";

    const scan = await markScanAsReviewed(scan_id, user_id, review_notes);

    res.json({
      scan_id: scan.scan_id,
      status: scan.status,
      reviewed_by: scan.reviewed_by,
      reviewed_at: scan.reviewed_at
    });
  } catch (error) {
    console.error("Mark as reviewed error:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ 
      error: error instanceof Error ? error.message : "Failed to mark scan as reviewed" 
    });
  }
}
