// controllers/ReportController.ts
import { Request, Response, NextFunction } from "express";
import { ExamModel } from "../models/Exam.ts";
import { ScanModel } from "../models/Scan.ts";
import { ClassModel } from "../models/Class.ts";
import { SectionModel } from "../models/Section.ts";
import { StudentModel } from "../models/Student.ts";
import { Types } from "mongoose";
import { computeRanks } from "../lib/ranking.ts";

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
     * - view: "section" | "overall" (optional, defaults to "section")
     */
    static async getPLEntries(req: Request, res: Response, next: NextFunction) {
        try {
            const { grade_id, class_id, exam_id, view = "section" } = req.query;

            // Validate required parameters
            if (!grade_id || !class_id || !exam_id) {
                return res.status(400).json({ 
                    error: "Missing required parameters: grade_id, class_id, exam_id" 
                });
            }

            // Validate view parameter
            if (view !== "section" && view !== "overall") {
                return res.status(400).json({ 
                    error: "Invalid view parameter. Must be 'section' or 'overall'" 
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

            // Validate exam belongs to selected class
            if (examDoc.class_id && !examDoc.class_id.equals(classObjectId)) {
                return res.status(400).json({ 
                    error: "Selected exam does not belong to the selected class" 
                });
            }

            // Get section_ids from class
            const sectionIds = classDoc.section_ids || [];
            if (sectionIds.length === 0) {
                return res.json({ 
                    view,
                    sections: [],
                    overall: null 
                });
            }

            // Fetch all sections
            const sections = await SectionModel.find({
                _id: { $in: sectionIds },
                is_active: true
            }).lean();

            if (sections.length === 0) {
                return res.json({ 
                    view,
                    sections: [],
                    overall: null 
                });
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
                                scan_count: 0,
                                number_of_items: examDoc.answers?.length || 0,
                                hso: 0,
                                lso: 0
                            }
                        };
                    }

                    // Fetch all graded scans
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

                    // Compute distribution across full range
                    const distribution = computeDistribution(scores, totalPoints);

                    // Calculate statistics
                    const totalF = distribution.reduce((sum, row) => sum + row.f, 0);
                    const totalFx = distribution.reduce((sum, row) => sum + row.fx, 0);
                    const mean = totalF > 0 ? totalFx / totalF : 0;
                    const pl = totalPoints > 0 ? (mean / totalPoints) * 100 : 0;
                    const mps = (100 - pl) * 0.02 + pl;

                    // Calculate HSO and LSO (for Summary)
                    const hso = scores.length > 0 ? Math.max(...scores) : 0;
                    const lso = scores.length > 0 ? Math.min(...scores) : 0;

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
                            scan_count: scans.length,
                            number_of_items: examDoc.answers?.length || 0,
                            hso: hso,
                            lso: lso
                        }
                    };
                })
            );

            // Calculate overall statistics if view is "overall"
            let overallData = null;
            if (view === "overall") {
                // Aggregate distribution across all sections
                // Map: score -> { f: total frequency, fx: total f*x }
                const overallDistributionMap = new Map<number, { f: number; fx: number }>();

                // Initialize all scores from totalPoints down to 0
                for (let score = totalPoints; score >= 0; score--) {
                    overallDistributionMap.set(score, { f: 0, fx: 0 });
                }

                // Aggregate from all sections
                let overallStudentCount = 0;
                let overallScanCount = 0;
                const allHSOs: number[] = [];
                const allLSOs: number[] = [];

                for (const section of sectionResults) {
                    overallStudentCount += section.metadata.student_count;
                    overallScanCount += section.metadata.scan_count;

                    // Collect HSO and LSO from each section (skip sections with no scans)
                    if (section.metadata.scan_count > 0) {
                        allHSOs.push(section.metadata.hso);
                        allLSOs.push(section.metadata.lso);
                    }

                    for (const distRow of section.distribution) {
                        const current = overallDistributionMap.get(distRow.score);
                        if (current) {
                            current.f += distRow.f;
                            current.fx += distRow.fx;
                        }
                    }
                }

                // Build overall distribution array
                const overallDistribution = Array.from(overallDistributionMap.entries())
                    .map(([score, { f, fx }]) => ({ score, f, fx }))
                    .sort((a, b) => b.score - a.score); // Descending order

                // Calculate overall statistics
                const overallTotalF = overallDistribution.reduce((sum, row) => sum + row.f, 0);
                const overallTotalFx = overallDistribution.reduce((sum, row) => sum + row.fx, 0);
                const overallMean = overallTotalF > 0 ? overallTotalFx / overallTotalF : 0;
                const overallPL = totalPoints > 0 ? (overallMean / totalPoints) * 100 : 0;
                const overallMPS = (100 - overallPL) * 0.02 + overallPL;

                // Calculate overall HSO and LSO
                // HSO is the maximum across all section HSOs
                // LSO is the minimum across all section LSOs
                const overallHSO = allHSOs.length > 0 ? Math.max(...allHSOs) : 0;
                const overallLSO = allLSOs.length > 0 ? Math.min(...allLSOs) : 0;

                overallData = {
                    statistics: {
                        mean: parseFloat(overallMean.toFixed(2)),
                        pl_percentage: parseFloat(overallPL.toFixed(2)),
                        mps: parseFloat(overallMPS.toFixed(2)),
                        total_f: overallTotalF,
                        total_fx: overallTotalFx
                    },
                    distribution: overallDistribution,
                    metadata: {
                        total_points: totalPoints,
                        student_count: overallStudentCount,
                        scan_count: overallScanCount,
                        number_of_items: examDoc.answers?.length || 0,
                        hso: overallHSO,
                        lso: overallLSO
                    }
                };
            }

            res.json({ 
                view,
                sections: sectionResults,
                overall: overallData 
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/reports/item-entries
     * Returns per-question performance analysis by section or aggregated
     * 
     * Query params:
     * - grade_id: string (required)
     * - class_id: string (required)
     * - exam_id: string (required)
     * - view: "section" | "overall" (optional, defaults to "section")
     */
    static async getItemEntries(req: Request, res: Response, next: NextFunction) {
        try {
            const { grade_id, class_id, exam_id, view = "section" } = req.query;

            // Validate required parameters
            if (!grade_id || !class_id || !exam_id) {
                return res.status(400).json({ 
                    error: "Missing required parameters: grade_id, class_id, exam_id" 
                });
            }

            // Validate view parameter
            if (view !== "section" && view !== "overall") {
                return res.status(400).json({ 
                    error: "Invalid view parameter. Must be 'section' or 'overall'" 
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

            // Validate exam belongs to selected class
            if (examDoc.class_id && !examDoc.class_id.equals(classObjectId)) {
                return res.status(400).json({ 
                    error: "Selected exam does not belong to the selected class" 
                });
            }

            // Validate exam has answers
            if (!examDoc.answers || examDoc.answers.length === 0) {
                return res.status(400).json({ 
                    error: "Exam has no answer key defined" 
                });
            }

            // Get section_ids from class
            const sectionIds = classDoc.section_ids || [];
            if (sectionIds.length === 0) {
                return res.json({ 
                    view,
                    sections: [],
                    overall: null 
                });
            }

            // Fetch all sections
            const sections = await SectionModel.find({
                _id: { $in: sectionIds },
                is_active: true
            }).lean();

            if (sections.length === 0) {
                return res.json({ 
                    view,
                    sections: [],
                    overall: null 
                });
            }

            // Build question map from exam answers
            const questionMap = new Map<number, string>();
            for (const ans of examDoc.answers) {
                questionMap.set(Number(ans.question_id), ans.correct);
            }

            const totalQuestions = examDoc.answers.length;

            // Process each section
            const sectionResults = await Promise.all(
                sections.map(async (section) => {
                    // Student query with proper field handling
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
                            items: [],
                            metadata: {
                                total_students: 0,
                                total_questions: totalQuestions,
                                students_took_exam: 0,
                                section_total_correct: 0
                            }
                        };
                    }

                    // Fetch all graded scans for this exam and these students
                    // Use aggregation to get only the most recent scan per student (prevent double counting)
                    const scans = await ScanModel.aggregate([
                        {
                            $match: {
                                exam_id: examObjectId,
                                student_id: { $in: studentIds },
                                status: "graded",
                                "detection_result.detections": { $exists: true }
                            }
                        },
                        {
                            $sort: { createdAt: -1 }
                        },
                        {
                            $group: {
                                _id: "$student_id",
                                scan: { $first: "$$ROOT" }
                            }
                        },
                        {
                            $replaceRoot: { newRoot: "$scan" }
                        }
                    ]);

                    const studentsTookExam = scans.length;

                    // Build per-question correctness tracking
                    // questionCorrectness[questionNumber] = count of students who got it right
                    const questionCorrectness = new Map<number, number>();
                    
                    // Initialize all questions with 0 (use numeric keys)
                    for (const ans of examDoc.answers) {
                        questionCorrectness.set(Number(ans.question_id), 0);
                    }

                    let sectionTotalCorrect = 0;

                    // Process each scan's detections
                    for (const scan of scans) {
                        const detections = scan.detection_result?.detections || [];

                        for (const detection of detections) {
                            const questionId = Number(detection.question_id);
                            let studentAnswer = detection.selected;

                            // Normalize student answer to string for comparison
                            if (studentAnswer == null) continue;
                            if (Array.isArray(studentAnswer)) studentAnswer = studentAnswer.join(",");

                            // Skip if question not in answer key
                            if (!questionMap.has(questionId)) continue;

                            const correctAnswerRaw = questionMap.get(questionId);
                            if (correctAnswerRaw == null) continue;

                            const studentStr = String(studentAnswer).trim().toUpperCase();
                            const correctStr = String(correctAnswerRaw).trim().toUpperCase();

                            // Check if student answer matches correct answer (case-insensitive)
                            if (studentStr !== "" && studentStr === correctStr) {
                                const currentCount = questionCorrectness.get(questionId) || 0;
                                questionCorrectness.set(questionId, currentCount + 1);
                                sectionTotalCorrect++;
                            }
                        }
                    }

                    // Build items array
                    let items = Array.from(examDoc.answers).map((ans) => {
                        const questionId = Number(ans.question_id);
                        const correctCount = questionCorrectness.get(questionId) || 0;
                        const percentage = studentsTookExam > 0 
                            ? (correctCount / studentsTookExam) * 100 
                            : 0;
                        
                        // Determine remark based on percentage
                        let remark: "M" | "NM" | "NTM";
                        if (percentage >= 75) {
                            remark = "M";
                        } else if (percentage >= 60) {
                            remark = "NM";
                        } else {
                            remark = "NTM";
                        }

                        return {
                            question_number: questionId,
                            correct_count: correctCount,
                            total_students: studentsTookExam,
                            percentage: parseFloat(percentage.toFixed(2)),
                            remark
                        };
                    });

                    // Compute ranks for this section's items (handles ties)
                    const rankMap = computeRanks(items as Array<{ question_number: number; percentage: number }>);

                    // Attach rank info to items
                    items = items.map((it) => {
                        const r = rankMap.get(it.question_number);
                        return {
                            ...it,
                            rank_label: r ? r.rankLabel : null,
                            rank_numbers: r ? r.rankNumbers : []
                        };
                    });

                    // Sort by question number for consistent display
                    items.sort((a, b) => a.question_number - b.question_number);

                    return {
                        section_id: section._id.toString(),
                        section_name: section.name || section.section_id || "Unnamed Section",
                        items,
                        metadata: {
                            total_students: studentIds.length,
                            total_questions: totalQuestions,
                            students_took_exam: studentsTookExam,
                            section_total_correct: sectionTotalCorrect
                        }
                    };
                })
            );

            // Calculate overall statistics if view is "overall"
            let overallData = null;
            if (view === "overall") {
                // Aggregate across all sections
                const overallQuestionCorrectness = new Map<number, number>();
                let overallTotalCorrect = 0;
                let overallStudentsTookExam = 0;

                // Initialize all questions
                for (const ans of examDoc.answers) {
                    overallQuestionCorrectness.set(Number(ans.question_id), 0);
                }

                // Sum up correct counts from all sections
                for (const section of sectionResults) {
                    overallStudentsTookExam += section.metadata.students_took_exam;
                    overallTotalCorrect += section.metadata.section_total_correct;

                    for (const item of section.items) {
                        const currentCount = overallQuestionCorrectness.get(item.question_number) || 0;
                        overallQuestionCorrectness.set(
                            item.question_number, 
                            currentCount + item.correct_count
                        );
                    }
                }

                // Build overall items
                let overallItems = Array.from(examDoc.answers).map((ans) => {
                    const questionId = Number(ans.question_id);
                    const correctCount = overallQuestionCorrectness.get(questionId) || 0;
                    const percentage = overallStudentsTookExam > 0 
                        ? (correctCount / overallStudentsTookExam) * 100 
                        : 0;
                    
                    // Determine remark
                    let remark: "M" | "NM" | "NTM";
                    if (percentage >= 75) {
                        remark = "M";
                    } else if (percentage >= 60) {
                        remark = "NM";
                    } else {
                        remark = "NTM";
                    }

                    return {
                        question_number: questionId,
                        correct_count: correctCount,
                        total_students: overallStudentsTookExam,
                        percentage: parseFloat(percentage.toFixed(2)),
                        remark
                    };
                });

                // Compute ranks for overall items and attach
                const overallRankMap = computeRanks(overallItems as Array<{ question_number: number; percentage: number }>);
                overallItems = overallItems.map((it) => {
                    const r = overallRankMap.get(it.question_number);
                    return {
                        ...it,
                        rank_label: r ? r.rankLabel : null,
                        rank_numbers: r ? r.rankNumbers : []
                    };
                });

                // Sort by question number
                overallItems.sort((a, b) => a.question_number - b.question_number);

                // Calculate overall percentage
                const totalPossibleCorrect = overallStudentsTookExam * totalQuestions;
                const overallPercentage = totalPossibleCorrect > 0
                    ? (overallTotalCorrect / totalPossibleCorrect) * 100
                    : 0;

                overallData = {
                    items: overallItems,
                    metadata: {
                        total_students_took_exam: overallStudentsTookExam,
                        total_questions: totalQuestions,
                        total_correct: overallTotalCorrect,
                        total_possible: totalPossibleCorrect,
                        overall_percentage: parseFloat(overallPercentage.toFixed(2))
                    }
                };
            }

            res.json({ 
                view,
                sections: sectionResults,
                overall: overallData 
            });
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