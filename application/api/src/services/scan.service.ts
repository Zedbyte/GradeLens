import { ScanModel } from "../models/Scan.ts";
import { ExamModel } from "../models/Exam.ts";
import { enqueueScan } from "../queues/scan.queue.ts";
import { Types } from "mongoose";
import { QuestionDetection } from "@packages/types/scans/scans.types.ts";

export async function createScan(
  scan_id: string,
  filename: string,
  exam_id: string,
  student_id: string
) {
  // Lookup the exam to get the template_id
  const exam = await ExamModel.findById(exam_id);
  if (!exam) {
    throw new Error(`Exam not found: ${exam_id}`);
  }

  if (!exam.template_id) {
    throw new Error(`Exam ${exam_id} does not have a template_id`);
  }

  const scan = await ScanModel.create({
    scan_id,
    filename,
    status: "queued",
    exam_id: new Types.ObjectId(exam_id),
    student_id: new Types.ObjectId(student_id),
    template_id: exam.template_id,
    processing_started_at: new Date()
  });

  await enqueueScan({
    scan_id,
    image_path: filename,
    template: exam.template_id  // Use actual template from exam
  });

  return scan;
}

export async function listScans() {
  return ScanModel.find().sort({ createdAt: -1 }).lean();
}

export async function getScan(scan_id: string) {
  return ScanModel.findOne({ scan_id }).lean();
}
