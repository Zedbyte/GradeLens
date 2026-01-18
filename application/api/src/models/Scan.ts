import { Schema, model } from "mongoose";
import type { DetectionResult } from "../types/detection_result.types.ts";
import type { GradingResult } from "../types/grading_result.types.ts";

/**
 * Scan Model
 * 
 * Tracks the lifecycle of a scanned document through:
 * 1. Upload → queued
 * 2. CV processing → detection results (facts)
 * 3. Business logic → grading results (decisions)
 * 4. Manual review (if needed)
 */

export type ScanStatus =
  | "uploaded"      // Image received, saved to disk
  | "queued"        // Job pushed to Redis
  | "processing"    // Python worker is processing
  | "detected"      // CV complete, detection results available
  | "graded"        // Grading complete, results available
  | "needs_review"  // Requires manual review
  | "reviewed"      // Manual review completed
  | "failed"        // Processing failed
  | "error";        // Unrecoverable error

const ScanSchema = new Schema(
  {
    scan_id: { 
      type: String, 
      required: true,
      unique: true, 
      index: true 
    },
    
    // File information
    filename: { 
      type: String, 
      required: true 
    },
    file_size: { 
      type: Number 
    },
    mime_type: { 
      type: String 
    },
    
    // References
    template_id: { 
      type: String,
      index: true 
    },
    exam_id: { 
      type: String,
      index: true 
    },
    
    // Status tracking
    status: { 
      type: String, 
      enum: [
        "uploaded",
        "queued",
        "processing",
        "detected",
        "graded",
        "needs_review",
        "reviewed",
        "failed",
        "error"
      ],
      required: true,
      default: "uploaded",
      index: true
    },
    
    // CV Detection Results (from Python)
    detection_result: { 
      type: Schema.Types.Mixed,
      default: null
    },
    
    // Grading Results (from Node.js business logic)
    grading_result: { 
      type: Schema.Types.Mixed,
      default: null
    },
    
    // Legacy fields (for backward compatibility)
    confidence: { 
      type: Number,
      min: 0,
      max: 1
    },
    results: { 
      type: Schema.Types.Mixed 
    },
    
    // Error tracking
    error_message: { 
      type: String 
    },
    error_code: { 
      type: String 
    },
    
    // Processing metrics
    processing_started_at: { 
      type: Date 
    },
    processing_completed_at: { 
      type: Date 
    },
    processing_time_ms: { 
      type: Number 
    },
    
    // Manual review
    reviewed_by: { 
      type: String 
    },
    reviewed_at: { 
      type: Date 
    },
    review_notes: { 
      type: String 
    },
    
    // Audit trail
    logs: [{ 
      timestamp: { type: Date, default: Date.now },
      level: { type: String, enum: ["info", "warn", "error"] },
      message: String,
      data: Schema.Types.Mixed
    }],
    
    // Metadata
    uploaded_by: { 
      type: String 
    },
    metadata: { 
      type: Schema.Types.Mixed 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for common queries
ScanSchema.index({ status: 1, createdAt: -1 });
ScanSchema.index({ exam_id: 1, status: 1 });
ScanSchema.index({ template_id: 1, createdAt: -1 });
ScanSchema.index({ uploaded_by: 1, createdAt: -1 });

// Virtual for overall confidence (derived from detection result)
ScanSchema.virtual("overall_confidence").get(function() {
  if (!this.detection_result?.detections) return null;
  
  const confidences = this.detection_result.detections
    .map((d: any) => d.confidence)
    .filter((c: any) => c !== undefined && c !== null);
  
  if (confidences.length === 0) return null;
  
  return confidences.reduce((sum: number, c: number) => sum + c, 0) / confidences.length;
});

// Instance methods
ScanSchema.methods.addLog = function(level: "info" | "warn" | "error", message: string, data?: any) {
  this.logs.push({ timestamp: new Date(), level, message, data });
};

ScanSchema.methods.updateStatus = function(status: ScanStatus, message?: string) {
  this.status = status;
  if (message) {
    this.addLog("info", message);
  }
};

ScanSchema.methods.recordDetectionResult = function(result: DetectionResult) {
  this.detection_result = result;
  this.processing_time_ms = result.processing_time_ms;
  
  if (result.status === "success") {
    this.status = "detected";
  } else if (result.status === "needs_review") {
    this.status = "needs_review";
  } else {
    this.status = "failed";
    this.error_message = result.errors?.[0]?.message;
    this.error_code = result.errors?.[0]?.code;
  }
  
  this.processing_completed_at = new Date();
};

ScanSchema.methods.recordGradingResult = function(result: GradingResult) {
  this.grading_result = result;
  this.exam_id = result.exam_id;
  
  if (result.needs_manual_review) {
    this.status = "needs_review";
  } else {
    this.status = "graded";
  }
};

// Static methods
ScanSchema.statics.findByStatus = function(status: ScanStatus) {
  return this.find({ status }).sort({ createdAt: -1 });
};

ScanSchema.statics.findNeedingReview = function() {
  return this.find({ status: "needs_review" }).sort({ createdAt: 1 });
};

ScanSchema.statics.findByExam = function(exam_id: string) {
  return this.find({ exam_id }).sort({ createdAt: -1 });
};

export const ScanModel = model("Scan", ScanSchema);

export type ScanDocument = InstanceType<typeof ScanModel>;
