import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useQuizzes } from "@/features/quizzes/hooks/useQuizzes";
import { useClasses } from "@/features/classes/hooks/useClasses";
import { QuizFormDialog } from "@/features/quizzes/components/QuizFormDialog";
import type { CreateQuizRequest, Quiz, UpdateQuizRequest } from "@/features/quizzes/types/quizzes.types";
import DataTable from "@/components/data-table";
import getQuizColumns from "@/features/quizzes/columns/quizzes.columns";

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

  const handleSubmit = async (data: unknown) => {
    if (dialogMode === "create") {
      return await createQuiz(data as CreateQuizRequest);
    } else if (editingQuiz) {
      return await updateQuiz(editingQuiz._id, data as UpdateQuizRequest);
    }
    return false;
  };

  if (loading && quizzes.length === 0) {
    return <div className="flex p-8">Loading quizzes...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No quizzes yet</p>
            <Button onClick={handleAdd} variant="outline">
              <IconPlus className="mr-2 size-4" />
              Create your first quiz
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={getQuizColumns({ onEdit: handleEdit, onDelete: handleDelete })} data={quizzes} searchColumn="name" />
      )}

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
