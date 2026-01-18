/**
 * Grading result types for TypeScript
 * Maps to domain/schemas/grading_result.schema.json
 * 
 * Business logic output from Node.js layer
 * Contains correctness determination and scoring
 */

export type ReviewReason = "ambiguous" | "unanswered" | "low_confidence" | "multiple_marks";

export interface QuestionGrade {
  question_id: number;
  detected: string[]; // What CV detected
  correct_answer: string; // From answer key
  is_correct: boolean | null; // null if unanswered/ambiguous
  points_earned: number;
  points_possible: number;
  requires_review?: boolean;
  review_reason?: ReviewReason;
}

export interface ScoreSummary {
  points_earned: number;
  points_possible: number;
  percentage: number; // 0-100
  correct_count: number;
  incorrect_count: number;
  unanswered_count: number;
  ambiguous_count: number;
}

export type GradingStatus = "graded" | "needs_review" | "failed";

export interface GradingResult {
  scan_id: string;
  exam_id: string;
  status: GradingStatus;
  grades: QuestionGrade[];
  score: ScoreSummary;
  needs_manual_review: boolean;
  graded_at?: string; // ISO 8601 datetime
  graded_by?: string; // User ID or "system"
}
