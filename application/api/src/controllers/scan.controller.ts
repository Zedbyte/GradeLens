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
  const scan_id = uuid();
  const filename = `${scan_id}.jpg`;
  const filePath = path.join(STORAGE_DIR, filename);

  fs.writeFileSync(filePath, req.body.image, "base64");

  const scan = await createScan(scan_id, filename);

  res.status(202).json(scan);
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
