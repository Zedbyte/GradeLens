import { Request, Response, NextFunction } from "express";
import { ExamModel } from "../models/Exam.ts";
import { ScanModel } from "../models/Scan.ts";
import { ClassModel } from "../models/Class.ts";

/**
 * Report Controller
 * Provides aggregated reporting endpoints for quizzes and classes
 */
export class ReportController {
  /**
   * GET /api/reports/quiz-statistics
   * Returns per-quiz aggregated statistics for the current user
   */
  static async listQuizStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ error: "Unauthorized" });

      // Find quizzes created by user
      const quizzes = await ExamModel.find({ created_by: userId, is_active: true }).lean();

      const results = await Promise.all(
        quizzes.map(async (quiz: any) => {
          const scans = await ScanModel.find({ exam_id: quiz._id }).lean();
          const totalScans = scans.length;
          const gradedScans = scans.filter((s: any) => s.status === "graded").length;
          const needsReview = scans.filter((s: any) => s.status === "needs_review").length;

          const scores = scans
            .filter((s: any) => s.grading_result?.score !== undefined)
            .map((s: any) => s.grading_result.score);

          const averageScore = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
          const averagePercentage = quiz.total_points ? (averageScore / quiz.total_points) * 100 : 0;
          const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
          const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

          let completionRate = 0;
          if (quiz.class_id) {
            const classDoc = await ClassModel.findById(quiz.class_id).lean();
            if (classDoc && Array.isArray(classDoc.student_ids) && classDoc.student_ids.length > 0) {
              completionRate = (totalScans / classDoc.student_ids.length) * 100;
            }
          }

          return {
            quiz_id: quiz._id,
            exam_id: quiz.exam_id,
            name: quiz.name,
            total_scans: totalScans,
            graded_scans: gradedScans,
            needs_review: needsReview,
            average_score: averageScore,
            average_percentage: averagePercentage,
            highest_score: highestScore,
            lowest_score: lowestScore,
            completion_rate: completionRate,
          };
        })
      );

      res.json({ reports: results });
    } catch (error) {
      next(error);
    }
  }
}
