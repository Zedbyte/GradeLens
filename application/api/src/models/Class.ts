import { Schema, model, Types, Model } from "mongoose";

/**
 * Class Model
 * 
 * Represents a class/section containing students.
 * Can have multiple quizzes/exams assigned to it.
 */

export interface IClass {
  class_id: string;              // Unique class identifier
  name: string;                  // Class name (e.g., "Grade 10 Mathematics - Section A")
  description?: string;
  teacher_id: string;            // User ID of the teacher/creator
  student_ids: Types.ObjectId[]; // References to Student documents
  academic_year: string;         // e.g., "2025-2026"
  grade_id?: Types.ObjectId;     // Reference to Grade document
  section_id?: Types.ObjectId;   // Reference to Section document
  subject?: string;              // e.g., "Mathematics", "Science"
  status: "active" | "archived" | "completed";
  metadata?: {
    schedule?: string;           // e.g., "MWF 9:00-10:00"
    room?: string;
    notes?: string;
  };
  created_by: string;
  created_at?: Date;
  updated_at?: Date;
}

// Instance methods interface
export interface IClassMethods {
  addStudent(student_id: Types.ObjectId): Promise<this>;
  removeStudent(student_id: Types.ObjectId): Promise<this>;
}

// Static methods interface
export interface IClassModel extends Model<IClass, {}, IClassMethods> {
  findByClassId(class_id: string): Promise<(IClass & IClassMethods) | null>;
  findByTeacher(teacher_id: string, status?: string): Promise<(IClass & IClassMethods)[]>;
  findActiveClasses(teacher_id?: string): Promise<(IClass & IClassMethods)[]>;
  findByAcademicYear(academic_year: string, teacher_id?: string): Promise<(IClass & IClassMethods)[]>;
}

const ClassSchema = new Schema<IClass, IClassModel, IClassMethods>(
  {
    class_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    teacher_id: {
      type: String,
      required: true,
      index: true
    },
    student_ids: [{
      type: Schema.Types.ObjectId,
      ref: "Student"
    }],
    academic_year: {
      type: String,
      required: true,
      index: true
    },
    grade_id: {
      type: Schema.Types.ObjectId,
      ref: "Grade",
      index: true
    },
    section_id: {
      type: Schema.Types.ObjectId,
      ref: "Section",
      index: true
    },
    subject: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ["active", "archived", "completed"],
      default: "active",
      index: true
    },
    metadata: {
      schedule: { type: String },
      room: { type: String },
      notes: { type: String }
    },
    created_by: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for student count
ClassSchema.virtual("student_count").get(function() {
  return this.student_ids?.length || 0;
});

// Indexes for common queries
ClassSchema.index({ teacher_id: 1, status: 1 });
ClassSchema.index({ academic_year: 1, status: 1 });
ClassSchema.index({ created_by: 1, createdAt: -1 });

// Static methods
ClassSchema.statics.findByClassId = function(class_id: string) {
  return this.findOne({ class_id, status: { $ne: "archived" } });
};

ClassSchema.statics.findByTeacher = function(teacher_id: string, status?: string) {
  const query: any = { teacher_id };
  if (status) query.status = status;
  return this.find(query).sort({ academic_year: -1, name: 1 });
};

ClassSchema.statics.findActiveClasses = function(teacher_id?: string) {
  const query: any = { status: "active" };
  if (teacher_id) query.teacher_id = teacher_id;
  return this.find(query).sort({ academic_year: -1, name: 1 });
};

ClassSchema.statics.findByAcademicYear = function(academic_year: string, teacher_id?: string) {
  const query: any = { academic_year };
  if (teacher_id) query.teacher_id = teacher_id;
  return this.find(query).sort({ name: 1 });
};

// Instance methods
ClassSchema.methods.addStudent = async function(student_id: Types.ObjectId) {
  if (!this.student_ids.includes(student_id)) {
    this.student_ids.push(student_id);
    await this.save();
  }
  return this;
};

ClassSchema.methods.removeStudent = async function(student_id: Types.ObjectId) {
  this.student_ids = this.student_ids.filter(
    (id: any) => !id.equals(student_id)
  );
  await this.save();
  return this;
};

export const ClassModel = model<IClass, IClassModel>("Class", ClassSchema);

export type ClassDocument = InstanceType<typeof ClassModel>;
