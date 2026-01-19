import { Request, Response, NextFunction } from "express";
import { ClassModel } from "../models/Class.ts";
import { StudentModel } from "../models/Student.ts";
import type { CreateClassRequest, UpdateClassRequest } from "../types/class.types.ts";
import { Types } from "mongoose";

/**
 * Class Controller
 * Handles CRUD operations for classes and student assignments
 */

export class ClassController {
  /**
   * Create a new class
   * POST /api/classes
   */
  static async createClass(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const data: CreateClassRequest = req.body;

      // Check if class_id already exists
      const existing = await ClassModel.findOne({ class_id: data.class_id });
      if (existing) {
        return res.status(409).json({ error: "Class ID already exists" });
      }

      const classDoc = new ClassModel({
        ...data,
        teacher_id: userId,
        created_by: userId,
        status: "active",
        student_ids: data.student_ids || []
      });

      await classDoc.save();

      // Update students' class_ids
      if (data.student_ids && data.student_ids.length > 0) {
        await StudentModel.updateMany(
          { _id: { $in: data.student_ids } },
          { $addToSet: { class_ids: classDoc._id } }
        );
      }

      res.status(201).json({
        message: "Class created successfully",
        class: classDoc
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all classes
   * GET /api/classes
   */
  static async listClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const { status, academic_year, page = 1, limit = 50 } = req.query;

      const query: any = { teacher_id: userId };
      
      if (status) {
        query.status = status;
      }
      
      if (academic_year) {
        query.academic_year = academic_year;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [classes, total] = await Promise.all([
        ClassModel.find(query)
          .sort({ academic_year: -1, name: 1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        ClassModel.countDocuments(query)
      ]);

      res.json({
        classes,
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
   * Get class by ID with populated students
   * GET /api/classes/:id
   */
  static async getClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { populate_students } = req.query;

      let query = ClassModel.findOne({
        _id: id,
        teacher_id: userId
      });

      if (populate_students === "true") {
        query = query.populate("student_ids", "student_id first_name last_name email status");
      }

      const classDoc = await query;

      if (!classDoc) {
        return res.status(404).json({ error: "Class not found" });
      }

      res.json({ class: classDoc });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update class
   * PUT /api/classes/:id
   */
  static async updateClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updates: UpdateClassRequest = req.body;

      const classDoc = await ClassModel.findOne({
        _id: id,
        teacher_id: userId
      });

      if (!classDoc) {
        return res.status(404).json({ error: "Class not found" });
      }

      // Update fields
      Object.assign(classDoc, updates);
      await classDoc.save();

      res.json({
        message: "Class updated successfully",
        class: classDoc
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete (archive) class
   * DELETE /api/classes/:id
   */
  static async deleteClass(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const classDoc = await ClassModel.findOne({
        _id: id,
        teacher_id: userId
      });

      if (!classDoc) {
        return res.status(404).json({ error: "Class not found" });
      }

      // Soft delete - set status to archived
      classDoc.status = "archived";
      await classDoc.save();

      res.json({
        message: "Class archived successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add student to class
   * POST /api/classes/:id/students
   */
  static async addStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { student_id } = req.body;
      const userId = req.user?.id;

      if (!student_id) {
        return res.status(400).json({ error: "student_id is required" });
      }

      const [classDoc, student] = await Promise.all([
        ClassModel.findOne({ _id: id, teacher_id: userId }),
        StudentModel.findById(student_id)
      ]);

      if (!classDoc) {
        return res.status(404).json({ error: "Class not found" });
      }

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Add student to class
      const studentObjectId = new Types.ObjectId(student_id);
      if (!classDoc.student_ids.some(sid => sid.equals(studentObjectId))) {
        classDoc.student_ids.push(studentObjectId);
        await classDoc.save();

        // Update student's class_ids
        if (!student.class_ids.some(cid => cid.equals(classDoc._id))) {
          student.class_ids.push(classDoc._id);
          await student.save();
        }
      }

      res.json({
        message: "Student added to class successfully",
        class: classDoc
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove student from class
   * DELETE /api/classes/:id/students/:studentId
   */
  static async removeStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, studentId } = req.params;
      const userId = req.user?.id;

      const studentIdStr = Array.isArray(studentId) ? studentId[0] : studentId;

      const [classDoc, student] = await Promise.all([
        ClassModel.findOne({ _id: id, teacher_id: userId }),
        StudentModel.findById(studentIdStr)
      ]);

      if (!classDoc) {
        return res.status(404).json({ error: "Class not found" });
      }

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Remove student from class
      const studentObjectId = new Types.ObjectId(studentIdStr);
      classDoc.student_ids = classDoc.student_ids.filter(
        sid => !sid.equals(studentObjectId)
      );
      await classDoc.save();

      // Update student's class_ids
      student.class_ids = student.class_ids.filter(
        cid => !cid.equals(classDoc._id)
      );
      await student.save();

      res.json({
        message: "Student removed from class successfully"
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get students in class
   * GET /api/classes/:id/students
   */
  static async getClassStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const classDoc = await ClassModel.findOne({
        _id: id,
        teacher_id: userId
      }).populate("student_ids", "student_id first_name last_name email status");

      if (!classDoc) {
        return res.status(404).json({ error: "Class not found" });
      }

      res.json({
        students: classDoc.student_ids,
        total: classDoc.student_ids.length
      });
    } catch (error) {
      next(error);
    }
  }
}
