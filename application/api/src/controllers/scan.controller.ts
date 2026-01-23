import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";
import { createScan, listScans, getScan } from "../services/scan.service.ts";

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

export async function getScans(req: Request, res: Response) {
  res.json(await listScans());
}

export async function getScanById(req: Request, res: Response) {
  const scan_id = Array.isArray(req.params.scan_id) ? req.params.scan_id[0] : req.params.scan_id;
  const scan = await getScan(scan_id);
  if (!scan) return res.sendStatus(404);
  res.json(scan);
}
