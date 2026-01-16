import { ScanModel } from "../models/Scan.ts";
import { enqueueScan } from "../queues/scan.queue.ts";

export async function createScan(scan_id: string, filename: string) {
  const scan = await ScanModel.create({
    scan_id,
    filename,
    status: "queued"
  });

  await enqueueScan({
    scan_id,
    image_path: filename,
    template: "form_A"
  });

  return scan;
}

export async function listScans() {
  return ScanModel.find().sort({ createdAt: -1 }).lean();
}

export async function getScan(scan_id: string) {
  return ScanModel.findOne({ scan_id }).lean();
}
