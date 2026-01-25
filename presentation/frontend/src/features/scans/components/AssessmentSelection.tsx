import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2 min-w-64">
        <Label htmlFor="quiz-select" className="text-sm font-medium">
          Quiz
        </Label>
        <Select value={selectedQuiz} onValueChange={onQuizChange}>
          <SelectTrigger id="quiz-select" className="w-full">
            <SelectValue placeholder="Select Quiz" />
          </SelectTrigger>
          <SelectContent>
            {quizzes.map((quiz) => (
              <SelectItem key={quiz._id} value={quiz._id}>
                {quiz.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2 min-w-64">
        <Label htmlFor="student-select" className="text-sm font-medium">
          Student
        </Label>
        <Select value={selectedStudent} onValueChange={onStudentChange}>
          <SelectTrigger id="student-select" className="w-full">
            <SelectValue placeholder="Select Student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student._id} value={student._id}>
                {student.first_name} {student.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedQuiz && quizDetails && (
        <div className="rounded-lg border bg-muted/30 px-4 py-2.5 flex items-center gap-3">
          <div className="text-sm font-medium">{quizDetails.name}</div>
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
    </div>
  );
}
