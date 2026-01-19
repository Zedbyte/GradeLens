import { Request, Response, NextFunction } from "express";
import { StudentModel } from "../models/Student.ts";
import type { CreateStudentRequest, UpdateStudentRequest } from "../types/student.types.ts";

/**
 * Student Controller
 * Handles CRUD operations for students
 */

export class StudentController {
  /**
   * Create a new student
   * POST /api/students
   */
  static async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const data: CreateStudentRequest = req.body;

      // Check if student_id already exists
      const existing = await StudentModel.findOne({ student_id: data.student_id });
      if (existing) {
        return res.status(409).json({ error: "Student ID already exists" });
      }

      const student = new StudentModel({
        ...data,
        created_by: userId,
        status: "active"
      });

      await student.save();

      res.status(201).json({
        message: "Student created successfully",
        student
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all students
   * GET /api/students
   */
  static async listStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { status, class_id, page = 1, limit = 50 } = req.query;

      const query: any = { created_by: userId };
      
      if (status) {
        query.status = status;
      }
      
      if (class_id) {
        query.class_ids = class_id;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [students, total] = await Promise.all([
        StudentModel.find(query)
          .sort({ last_name: 1, first_name: 1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        StudentModel.countDocuments(query)
      ]);

      res.json({
        students,
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
   * Get student by ID
   * GET /api/students/:id
   */
  static async getStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const student = await StudentModel.findOne({
        _id: id,
        created_by: userId
      }).populate("class_ids", "class_id name");

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json({ student });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update student
   * PUT /api/students/:id
   */
  static async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updates: UpdateStudentRequest = req.body;

      const student = await StudentModel.findOne({
        _id: id,
        created_by: userId
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Update fields
      Object.assign(student, updates);
      await student.save();

      res.json({
        message: "Student updated successfully",
        student
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete (deactivate) student
   * DELETE /api/students/:id
   */
  static async deleteStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const student = await StudentModel.findOne({
        _id: id,
        created_by: userId
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Soft delete - set status to inactive
      student.status = "inactive";
      await student.save();

      res.json({
        message: "Student deactivated successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get student by student_id
   * GET /api/students/by-student-id/:student_id
   */
  static async getByStudentId(req: Request, res: Response, next: NextFunction) {
    try {
      const { student_id } = req.params;
      const userId = req.user?.id;

      const student = await StudentModel.findOne({
        student_id,
        created_by: userId,
        status: { $ne: "inactive" }
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      res.json({ student });
    } catch (error) {
      next(error);
    }
  }
}
