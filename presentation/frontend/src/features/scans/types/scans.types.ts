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

export interface QuestionDetection {
  question_id: number;
  fill_ratios: Record<string, number>;
  selected: string[];
  detection_status: "answered" | "unanswered" | "ambiguous" | "error";
  confidence?: number;
}

export interface QualityMetrics {
  blur_score?: number;
  brightness_mean?: number;
  brightness_std?: number;
  skew_angle?: number;
  perspective_correction_applied?: boolean;
}

export interface DetectionWarning {
  code: string;
  message: string;
  question_id?: number;
}

export interface DetectionError {
  code: string;
  message: string;
  stage?: string;
}

export interface DetectionResult {
  status: "success" | "failed" | "needs_review";
  detections: QuestionDetection[];
  quality_metrics?: QualityMetrics;
  warnings: DetectionWarning[];
  errors: DetectionError[];
  processing_time_ms?: number;
  timestamp?: string;
}

export interface GradingResult {
  needs_manual_review?: boolean;
  score?: number;
  correct_answers?: number;
  total_questions?: number;
  percentage?: number;
  answers?: Array<{
    question_id: number;
    student_answer: string[];
    correct_answer: string[];
    is_correct: boolean;
  }>;
}

export interface ScanLog {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  data?: unknown;
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
  exam_id: string;      // Quiz/Exam ID
  student_id: string;   // Student ID
}

export interface UploadScanResponse {
  scan_id: string;
  status: string;
  exam_id: string;
  student_id: string;
  template_id: string;
}