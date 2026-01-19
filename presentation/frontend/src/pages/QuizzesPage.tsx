import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconEdit, IconTrash, IconCalendar, IconClipboard } from "@tabler/icons-react";
import { useQuizzes } from "@/features/quizzes/hooks/useQuizzes";
import { useClasses } from "@/features/classes/hooks/useClasses";
import { QuizFormDialog } from "@/features/quizzes/components/QuizFormDialog";
import type { Quiz } from "@/features/quizzes/types/quizzes.types";

export default function QuizzesPage() {
  const { quizzes, loading, error, total, loadQuizzes, createQuiz, updateQuiz, deleteQuiz } = useQuizzes();
  const { classes, loadClasses } = useClasses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | undefined>();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    loadQuizzes();
    loadClasses(); // Load classes for the quiz form dropdown
  }, [loadQuizzes, loadClasses]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to archive ${name}?`)) {
      await deleteQuiz(id);
    }
  };

  const handleAdd = () => {
    setEditingQuiz(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (dialogMode === "create") {
      return await createQuiz(data);
    } else if (editingQuiz) {
      return await updateQuiz(editingQuiz._id, data);
    }
    return false;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quizzes</h1>
          <p className="text-muted-foreground">Create and manage quizzes with answer keys</p>
        </div>
        <Button onClick={handleAdd}>
          <IconPlus className="mr-2 size-4" />
          Create Quiz
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quiz List</CardTitle>
          <CardDescription>
            {total > 0 ? `${total} quizzes found` : "No quizzes yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No quizzes yet</p>
                <p className="text-sm">Create your first quiz to start grading</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{quiz.name}</h3>
                      <Badge
                        variant={
                          quiz.status === "active"
                            ? "default"
                            : quiz.status === "draft"
                            ? "secondary"
                            : quiz.status === "completed"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {quiz.status}
                      </Badge>
                    </div>
                    {quiz.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{quiz.description}</p>
                    )}
                    <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <IconClipboard className="size-4" />
                        <span>
                          {quiz.question_count} questions ({quiz.total_points} pts)
                        </span>
                      </div>
                      <span>Template: {quiz.template_id}</span>
                      {quiz.scheduled_date && (
                        <div className="flex items-center gap-1">
                          <IconCalendar className="size-4" />
                          <span>{formatDate(quiz.scheduled_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(quiz)}>
                      <IconEdit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(quiz._id, quiz.name)}
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <QuizFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        quiz={editingQuiz}
        mode={dialogMode}
        classes={classes}
      />
    </div>
  );
}
