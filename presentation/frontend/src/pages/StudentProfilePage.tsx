import { useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStudents } from "@/features/students/hooks/useStudents";
import { useScans } from "@/features/scans/hooks/useScans";
import { useExams } from "@/features/exams/hooks/useExams";
import { Button } from "@/components/ui/button";
import { IconArrowLeft } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScanQueue } from "@/features/scans/components/ScanQueue";
import { ScanDetails } from "@/features/scans/components/ScanDetails";

export default function StudentProfilePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { students, loadStudents } = useStudents();
    const { scans, selectedScanId, selectScan, loadScans } = useScans();
    const { exams, loadExams } = useExams();

    // Find the student by ID
    const student = useMemo(() => {
        return students.find((s) => s._id === id);
    }, [students, id]);

    // Filter scans for this student
    const studentScans = useMemo(() => {
        return scans.filter((scan) => scan.student_id === id);
    }, [scans, id]);

    useEffect(() => {
        loadStudents();
        loadScans();
        loadExams();
    }, [loadStudents, loadScans, loadExams]);

    if (!student) {
        return (
        <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">Student not found</p>
        </div>
        );
    }

    return (
        <div className="flex h-full flex-col gap-4 p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/students")}>
            <IconArrowLeft className="size-5" />
            </Button>
            <div>
            <h1 className="text-2xl font-bold">
                {student.first_name} {student.last_name}
            </h1>
            <p className="text-sm text-muted-foreground">
                {student.student_id} • {student.email}
            </p>
            </div>
        </div>

        {/* Student Info Card */}
        <Card>
            <CardHeader>
            <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
            <div className="grid grid-cols-2 gap-4">
                <div>
                <p className="text-sm font-medium text-muted-foreground">First Name</p>
                <p>{student.first_name}</p>
                </div>
                <div>
                <p className="text-sm font-medium text-muted-foreground">Last Name</p>
                <p>{student.last_name}</p>
                </div>
                <div>
                <p className="text-sm font-medium text-muted-foreground">Student ID</p>
                <p>{student.student_id}</p>
                </div>
                <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{student.email}</p>
                </div>
                <div>
                <p className="text-sm font-medium text-muted-foreground">Section</p>
                <p>{student.section_id || "Not assigned"}</p>
                </div>
                <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="capitalize">{student.status}</p>
                </div>
            </div>
            </CardContent>
        </Card>

        {/* Scans Section */}
        <div className="flex-1 grid grid-cols-[350px_1fr] gap-4">
            <ScanQueue 
                scans={studentScans}
                onSelect={selectScan}
                selectedScanId={selectedScanId || undefined}
                exams={exams}
                students={students}
            />
            <ScanDetails 
                exams={exams}
                students={students}
            />
        </div>
        </div>
    );
}
