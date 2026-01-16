import { Schema, model } from "mongoose";

export type ScanStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "needs_review";

const ScanSchema = new Schema(
  {
    scan_id: { type: String, unique: true, index: true },
    filename: String,
    status: String,
    confidence: Number,
    results: Schema.Types.Mixed,
    logs: [Schema.Types.Mixed]
  },
  { timestamps: true }
);

export const ScanModel = model("Scan", ScanSchema);
