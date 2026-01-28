// types/reports.types.ts

/**
 * PL Entries API Response Types
 */

export interface PLEntriesDistributionRow {
  score: number;
  f: number;  // frequency
  fx: number; // frequency × score
}

export interface PLEntriesStatistics {
  mean: number;
  pl_percentage: number; // Performance Level percentage
  mps: number;          // Mean Percentage Score
  total_f: number;
  total_fx: number;
}

export interface PLEntriesMetadata {
  total_points: number;
  student_count: number;
  scan_count: number;
}

export interface PLEntriesSection {
  section_id: string;
  section_name: string;
  statistics: PLEntriesStatistics;
  distribution: PLEntriesDistributionRow[];
  metadata: PLEntriesMetadata;
}

export interface PLEntriesResponse {
  sections: PLEntriesSection[];
}

export interface PLEntriesQueryParams {
  grade_id: string;
  class_id: string;
  exam_id: string;
}