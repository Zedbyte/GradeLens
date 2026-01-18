import { Schema, model } from "mongoose";
import type { AnswerKey } from "../types/answer_key.types.ts";

/**
 * Exam Model
 * 
 * Stores exam definitions including answer keys and grading policies.
 * Used by Node.js grading logic to compare detection results.
 */

const AnswerSchema = new Schema({
  question_id: { type: Number, required: true },
  correct: { type: String, required: true, match: /^[A-Z]$/ },
  points: { type: Number, default: 1, min: 0 }
}, { _id: false });

const GradingPolicySchema = new Schema({
  partial_credit: { type: Boolean, default: false },
  penalty_incorrect: { type: Number, default: 0, min: 0 },
  require_manual_review_on_ambiguity: { type: Boolean, default: true }
}, { _id: false });

const ExamMetadataSchema = new Schema({
  created_at: { type: Date },
  created_by: { type: String }, // User ID reference
  total_points: { type: Number }
}, { _id: false });

const ExamSchema = new Schema(
  {
    exam_id: { 
      type: String, 
      required: true, 
      unique: true, 
      index: true 
    },
    template_id: { 
      type: String, 
      required: true,
      index: true 
    },
    name: { 
      type: String, 
      required: true 
    },
    answers: { 
      type: [AnswerSchema], 
      required: true,
      validate: {
        validator: (v: any[]) => v && v.length > 0,
        message: "Exam must have at least one answer"
      }
    },
    grading_policy: { 
      type: GradingPolicySchema, 
      default: () => ({
        partial_credit: false,
        penalty_incorrect: 0,
        require_manual_review_on_ambiguity: true
      })
    },
    metadata: { 
      type: ExamMetadataSchema 
    },
    
    // Denormalized fields for quick queries
    question_count: { 
      type: Number, 
      index: true 
    },
    total_points: { 
      type: Number 
    },
    
    // Audit fields
    created_by: { 
      type: String, 
      required: true 
    },
    is_active: { 
      type: Boolean, 
      default: true, 
      index: true 
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for common queries
ExamSchema.index({ template_id: 1, is_active: 1 });
ExamSchema.index({ created_by: 1, createdAt: -1 });

// Pre-save middleware to calculate denormalized fields
ExamSchema.pre("save", function(next) {
  if (this.isModified("answers")) {
    this.question_count = this.answers.length;
    this.total_points = this.answers.reduce((sum, ans) => sum + (ans.points || 1), 0);
  }
  next();
});

// Instance methods
ExamSchema.methods.toAnswerKey = function(): AnswerKey {
    return {
        exam_id: this.exam_id,
        template_id: this.template_id,
        name: this.name,
        answers: this.answers.map((a: any) => ({
        question_id: a.question_id,
        correct: a.correct,
        points: a.points
        })),
        grading_policy: this.grading_policy,
        metadata: {
        created_at: this.metadata?.created_at?.toISOString(),
        created_by: this.metadata?.created_by || this.created_by,
        total_points: this.total_points
        }
    };
};

// Static methods
ExamSchema.statics.findActiveByTemplate = function(template_id: string) {
  return this.find({ template_id, is_active: true }).sort({ createdAt: -1 });
};

ExamSchema.statics.findByExamId = function(exam_id: string) {
  return this.findOne({ exam_id, is_active: true });
};

export const ExamModel = model("Exam", ExamSchema);

export type ExamDocument = InstanceType<typeof ExamModel>;
