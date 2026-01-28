// controllers/ReportController.ts
import { Request, Response, NextFunction } from "express";
import { ExamModel } from "../models/Exam.ts";
import { ScanModel } from "../models/Scan.ts";
import { ClassModel } from "../models/Class.ts";
import { SectionModel } from "../models/Section.ts";
import { StudentModel } from "../models/Student.ts";
import { Types } from "mongoose";

/**
 * Report Controller
 * Provides aggregated reporting endpoints for PL (Performance Level) analysis
 */
export class ReportController {
    /**
     * GET /api/reports/pl-entries
     * Returns per-section performance level statistics
     * 
     * Query params:
     * - grade_id: string (required)
     * - class_id: string (required)
     * - exam_id: string (required)
     */
    static async getPLEntries(req: Request, res: Response, next: NextFunction) {
        try {
        const { grade_id, class_id, exam_id } = req.query;

        // Validate required parameters
        if (!grade_id || !class_id || !exam_id) {
            return res.status(400).json({ 
                error: "Missing required parameters: grade_id, class_id, exam_id" 
            });
        }

        const classObjectId = new Types.ObjectId(class_id as string);
        const examObjectId = new Types.ObjectId(exam_id as string);

        // Fetch and validate class
        const classDoc = await ClassModel.findById(classObjectId).lean();
        if (!classDoc) {
            return res.status(404).json({ error: "Class not found" });
        }

        // Fetch and validate exam
        const examDoc = await ExamModel.findById(examObjectId).lean();
        if (!examDoc) {
            return res.status(404).json({ error: "Exam not found" });
        }

        // Validate exam belongs to selected class (optional but recommended)
        if (examDoc.class_id && !examDoc.class_id.equals(classObjectId)) {
            return res.status(400).json({ 
            error: "Selected exam does not belong to the selected class" 
            });
        }

        // Get section_ids from class
        const sectionIds = classDoc.section_ids || [];
        if (sectionIds.length === 0) {
            return res.json({ sections: [] });
        }

        // Fetch all sections
        const sections = await SectionModel.find({
            _id: { $in: sectionIds },
            is_active: true
        }).lean();

        if (sections.length === 0) {
            return res.json({ sections: [] });
        }

        // Get total points from exam
        const totalPoints = examDoc.total_points || 0;
        if (totalPoints === 0) {
            return res.status(400).json({ 
            error: "Exam has no total_points defined" 
            });
        }

        // Process each section
        const sectionResults = await Promise.all(
            sections.map(async (section) => {
            // We need students that truly belong to this section.
            // Rule:
            //  - Prefer students where `section_id === section._id`.
            //  - If a student has no `section_id` but belongs to the class via `class_ids`, include them (unsectioned students attached to class).
            //  - Do NOT include students from other sections just because they share the same class.
            const studentQuery = {
                $and: [
                {
                    $or: [
                    { section_id: section._id },
                    {
                        $and: [
                        { section_id: { $exists: false } },
                        { class_ids: classObjectId }
                        ]
                    }
                    ]
                },
                {
                    $or: [
                    { is_active: true },
                    { status: "active" }
                    ]
                }
                ]
            };

            const students = await StudentModel.find(studentQuery).lean();
            const studentIds = students.map((s) => s._id);

            // Edge case: no students in section
            if (studentIds.length === 0) {
                return {
                section_id: section._id.toString(),
                section_name: section.name || section.section_id || "Unnamed Section",
                statistics: {
                    mean: 0,
                    pl_percentage: 0,
                    mps: 0,
                    total_f: 0,
                    total_fx: 0
                },
                distribution: [],
                metadata: {
                    total_points: totalPoints,
                    student_count: 0,
                    scan_count: 0
                }
                };
            }

            // Fetch all graded scans for this exam and these students
            const scans = await ScanModel.find({
                exam_id: examObjectId,
                student_id: { $in: studentIds },
                status: "graded",
                "grading_result.score.points_earned": { $exists: true, $type: "number" }
            }).lean();

            // Extract scores
            const scores: number[] = [];
            for (const scan of scans) {
                const pointsEarned = scan.grading_result?.score?.points_earned;
                if (typeof pointsEarned === "number" && !isNaN(pointsEarned)) {
                scores.push(pointsEarned);
                }
            }

            // Compute distribution across full range 0..totalPoints
            const distribution = computeDistribution(scores, totalPoints);

            // Calculate statistics (only count non-zero frequencies)
            const totalF = distribution.reduce((sum, row) => sum + row.f, 0);
            const totalFx = distribution.reduce((sum, row) => sum + row.fx, 0);
            const mean = totalF > 0 ? totalFx / totalF : 0;
            const pl = totalPoints > 0 ? (mean / totalPoints) * 100 : 0;
            const mps = (100 - pl) * 0.02 + pl;

            return {
                section_id: section._id.toString(),
                section_name: section.name || section.section_id || "Unnamed Section",
                statistics: {
                mean: parseFloat(mean.toFixed(2)),
                pl_percentage: parseFloat(pl.toFixed(2)),
                mps: parseFloat(mps.toFixed(2)),
                total_f: totalF,
                total_fx: totalFx
                },
                distribution: distribution.map((row) => ({
                score: row.score,
                f: row.f,
                fx: row.fx
                })),
                metadata: {
                total_points: totalPoints,
                student_count: studentIds.length,
                scan_count: scans.length
                }
            };
            })
        );

        res.json({ sections: sectionResults });
        } catch (error) {
        next(error);
        }
    }
}

/**
 * Helper function to compute score distribution
 * Groups scores and calculates frequency (f) and frequency × score (fx)
 */
function computeDistribution(scores: number[], totalPoints: number): Array<{ score: number; f: number; fx: number }> {
    // Build frequency map (rounded integer scores)
    const freq = new Map<number, number>();
    for (const s of scores) {
        const key = Math.round(s);
        freq.set(key, (freq.get(key) || 0) + 1);
    }

    // Build full distribution from totalPoints down to 0 so UI always shows full range
    const out: Array<{ score: number; f: number; fx: number }> = [];
    for (let score = totalPoints; score >= 0; score--) {
        const f = freq.get(score) || 0;
        out.push({ score, f, fx: f * score });
    }

    return out;
}