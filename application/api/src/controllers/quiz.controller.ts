import { Request, Response, NextFunction } from "express";
import { ExamModel } from "../models/Exam.ts";
import { ClassModel } from "../models/Class.ts";
import { ScanModel } from "../models/Scan.ts";
import type { CreateQuizRequest, UpdateQuizRequest } from "../types/quiz.types.ts";
import { Types } from "mongoose";

/**
 * Quiz Controller
 * Handles CRUD operations for quizzes/exams
 */

export class QuizController {
  /**
   * Create a new quiz
   * POST /api/quizzes
   */
  static async createQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const data: CreateQuizRequest = req.body;

      // Auto-generate exam_id if not provided
      if (!data.exam_id) {
        const base = data.name.split(" ")[0].toUpperCase().replace(/[^A-Z0-9]/g, "");
        let candidate = base || `QUIZ${Date.now().toString().slice(-5)}`;
        let exists = await ExamModel.findOne({ exam_id: candidate });
        let idx = 1;
        while (exists) {
          candidate = `${base || 'QUIZ'}${Date.now().toString().slice(-5)}${idx}`;
          exists = await ExamModel.findOne({ exam_id: candidate });
          idx += 1;
        }
        data.exam_id = candidate;
      } else {
        // Check if exam_id already exists when provided
        const existing = await ExamModel.findOne({ exam_id: data.exam_id });
        if (existing) {
          return res.status(409).json({ error: "Quiz ID already exists" });
        }
      }

      // Verify class exists if provided
      if (data.class_id) {
        const classDoc = await ClassModel.findById(data.class_id);
        if (!classDoc) {
          return res.status(404).json({ error: "Class not found" });
        }
      }

      const quiz = new ExamModel({
        ...data,
        created_by: userId,
        status: "draft",
        is_active: true,
        grading_policy: data.grading_policy || {
          partial_credit: false,
          penalty_incorrect: 0,
          require_manual_review_on_ambiguity: true
        }
      });

      await quiz.save();

      res.status(201).json({
        message: "Quiz created successfully",
        quiz
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all quizzes
   * GET /api/quizzes
   */
  static async listQuizzes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { status, class_id, template_id, page = 1, limit = 50 } = req.query;

      const query: any = { created_by: userId, is_active: true };
      
      if (status) {
        query.status = status;
      }
      
      if (class_id) {
        query.class_id = class_id;
      }

      if (template_id) {
        query.template_id = template_id;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [quizzes, total] = await Promise.all([
        ExamModel.find(query)
          .populate("class_id", "class_id name student_count")
          .sort({ scheduled_date: -1, createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        ExamModel.countDocuments(query)
      ]);

      res.json({
        quizzes,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quiz by ID
   * GET /api/quizzes/:id
   */
  static async getQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const quiz = await ExamModel.findOne({
        _id: id,
        created_by: userId,
        is_active: true
      }).populate("class_id", "class_id name academic_year student_count");

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      res.json({ quiz });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update quiz
   * PUT /api/quizzes/:id
   */
  static async updateQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updates: UpdateQuizRequest = req.body;

      const quiz = await ExamModel.findOne({
        _id: id,
        created_by: userId,
        is_active: true
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Verify class exists if being updated
      if (updates.class_id) {
        const classDoc = await ClassModel.findById(updates.class_id);
        if (!classDoc) {
          return res.status(404).json({ error: "Class not found" });
        }
      }

      // Update fields
      Object.assign(quiz, updates);
      await quiz.save();

      res.json({
        message: "Quiz updated successfully",
        quiz
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete (deactivate) quiz
   * DELETE /api/quizzes/:id
   */
  static async deleteQuiz(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const quiz = await ExamModel.findOne({
        _id: id,
        created_by: userId,
        is_active: true
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Soft delete - set is_active to false and status to archived
      quiz.is_active = false;
      quiz.status = "archived";
      await quiz.save();

      res.json({
        message: "Quiz archived successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update quiz status
   * PATCH /api/quizzes/:id/status
   */
  static async updateQuizStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user?.id;

      if (!["draft", "active", "completed", "archived"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const quiz = await ExamModel.findOne({
        _id: id,
        created_by: userId,
        is_active: true
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      quiz.status = status;
      if (status === "archived") {
        quiz.is_active = false;
      }
      await quiz.save();

      res.json({
        message: "Quiz status updated successfully",
        quiz
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quiz statistics
   * GET /api/quizzes/:id/statistics
   */
  static async getQuizStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const quiz = await ExamModel.findOne({
        _id: id,
        created_by: userId,
        is_active: true
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      // Get all scans for this quiz
      const scans = await ScanModel.find({ exam_id: quiz._id });

      const totalScans = scans.length;
      const gradedScans = scans.filter(s => s.status === "graded").length;
      const needsReview = scans.filter(s => s.status === "needs_review").length;

      // Calculate score statistics
      const scores = scans
        .filter(s => s.grading_result?.score !== undefined)
        .map(s => s.grading_result.score);

      const averageScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      const averagePercentage = quiz.total_points! > 0
        ? (averageScore / quiz.total_points!) * 100
        : 0;

      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

      // Calculate completion rate
      let completionRate = 0;
      if (quiz.class_id) {
        const classDoc = await ClassModel.findById(quiz.class_id);
        if (classDoc && classDoc.student_ids.length > 0) {
          completionRate = (totalScans / classDoc.student_ids.length) * 100;
        }
      }

      res.json({
        quiz_id: quiz._id,
        total_scans: totalScans,
        graded_scans: gradedScans,
        needs_review: needsReview,
        average_score: averageScore,
        average_percentage: averagePercentage,
        highest_score: highestScore,
        lowest_score: lowestScore,
        completion_rate: completionRate
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get scans for quiz
   * GET /api/quizzes/:id/scans
   */
  static async getQuizScans(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { status, page = 1, limit = 50 } = req.query;

      const quiz = await ExamModel.findOne({
        _id: id,
        created_by: userId,
        is_active: true
      });

      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }

      const query: any = { exam_id: quiz._id };
      if (status) {
        query.status = status;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [scans, total] = await Promise.all([
        ScanModel.find(query)
          .populate("student_id", "student_id first_name last_name")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        ScanModel.countDocuments(query)
      ]);

      res.json({
        scans,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      });
    } catch (error) {
      next(error);
    }
  }
}
