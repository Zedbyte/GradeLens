export type ScanStatus =
  | "uploaded"
  | "queued"
  | "processing"
  | "detected"
  | "graded"
  | "needs_review"
  | "reviewed"
  | "failed"
  | "error";

export interface ScanLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: unknown;
}

export interface DetectionResult {
  status: string;
  detections?: unknown[];
  processing_time_ms?: number;
  errors?: Array<{
    message: string;
    code?: string;
  }>;
}

export interface GradingResult {
  needs_manual_review?: boolean;
  score?: number;
  correct_answers?: number;
  total_questions?: number;
  answers?: unknown[];
}

export interface Scan {
  _id?: string;
  scan_id: string;
  
  // File information
  filename: string;
  file_size?: number;
  mime_type?: string;
  
  // References
  template_id?: string;
  exam_id?: string;
  student_id?: string;
  class_id?: string;
  
  // Status tracking
  status: ScanStatus;
  
  // Results
  detection_result?: DetectionResult | null;
  grading_result?: GradingResult | null;
  
  // Legacy fields
  confidence?: number;
  results?: unknown;
  
  // Error tracking
  error_message?: string;
  error_code?: string;
  
  // Processing metrics
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_time_ms?: number;
  
  // Manual review
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  
  // Audit trail
  logs?: ScanLog[];
  
  // Metadata
  uploaded_by?: string;
  metadata?: unknown;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
  
  // Virtual
  overall_confidence?: number;
}

export interface UploadScanRequest {
  image: string; // base64
}

export interface UploadScanResponse {
  scan_id: string;
  status: string;
}