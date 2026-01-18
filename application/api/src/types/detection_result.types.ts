/**
 * Detection result types for TypeScript
 * Maps to domain/schemas/detection_result.schema.json
 * 
 * CRITICAL: Contains FACTS only from Python CV layer
 * No grading decisions or correctness determination
 */

export type DetectionStatus = "answered" | "unanswered" | "ambiguous" | "error";

export interface QuestionDetection {
  question_id: number;
  fill_ratios: Record<string, number>; // e.g., { "A": 0.05, "B": 0.82, ... }
  selected: string[]; // Empty if unanswered, multiple if ambiguous
  detection_status: DetectionStatus;
  confidence?: number; // 0.0 - 1.0
}

export interface QualityMetrics {
  blur_score?: number;
  brightness_mean?: number; // 0-255
  brightness_std?: number;
  skew_angle?: number;
  perspective_correction_applied?: boolean;
}

export interface DetectionWarning {
  code: string; // e.g., "LOW_BLUR_SCORE"
  message: string;
  question_id?: number;
}

export interface DetectionError {
  code: string; // e.g., "PAPER_NOT_DETECTED"
  message: string;
  stage?: string;
}

export type DetectionResultStatus = "success" | "failed" | "needs_review";

export interface DetectionResult {
  scan_id: string;
  template_id: string;
  status: DetectionResultStatus;
  detections: QuestionDetection[];
  quality_metrics?: QualityMetrics;
  warnings?: DetectionWarning[];
  errors?: DetectionError[];
  processing_time_ms?: number;
  timestamp?: string; // ISO 8601 datetime
}
