import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { Quiz } from "@/features/quizzes/types/quizzes.types";
import type { Student } from "@/features/students/types/students.types";

interface AssessmentSelectionProps {
  quizzes: Quiz[];
  students: Student[];
  selectedQuiz: string;
  selectedStudent: string;
  onQuizChange: (value: string) => void;
  onStudentChange: (value: string) => void;
  quizDetails?: Quiz;
}

export function AssessmentSelection({
  quizzes,
  students,
  selectedQuiz,
  selectedStudent,
  onQuizChange,
  onStudentChange,
  quizDetails,
}: AssessmentSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Assessment Selection</CardTitle>
        <CardDescription>Choose a quiz to scan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="quiz-select">Quiz</Label>
          <select
            id="quiz-select"
            value={selectedQuiz}
            onChange={(e) => onQuizChange(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select Quiz</option>
            {quizzes.map((quiz) => (
              <option key={quiz._id} value={quiz._id}>
                {quiz.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
            <Label htmlFor="student-select">Student</Label>
            <select
                id="student-select"
                value={selectedStudent}
                onChange={(e) => onStudentChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
                <option value="">Select Student</option>
                {students.map((student) => (
                <option key={student._id} value={student._id}>
                    {student.first_name} {student.last_name}
                </option>
                ))}
            </select>
        </div>

        {selectedQuiz && quizDetails && (
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-medium">Selected Quiz</p>
            <p className="text-sm">{quizDetails.name}</p>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {quizDetails.question_count || 0} questions
              </Badge>
              <Badge variant="outline" className="text-xs">
                {quizDetails.total_points || 0} points
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
