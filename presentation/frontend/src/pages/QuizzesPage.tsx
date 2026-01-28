import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuizzes } from "@/features/quizzes/hooks/useQuizzes";
import { useClasses } from "@/features/classes/hooks/useClasses";
import { QuizFormDialog } from "@/features/quizzes/components/QuizFormDialog";
import type { CreateQuizRequest, Quiz, UpdateQuizRequest } from "@/features/quizzes/types/quizzes.types";
import DataTable from "@/components/data-table";
import getQuizColumns from "@/features/quizzes/columns/quizzes.columns";
import CrudListLayout from "@/components/CrudListLayout";

export default function QuizzesPage() {
  const { quizzes, loading, error, loadQuizzes, createQuiz, updateQuiz, deleteQuiz } = useQuizzes();
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
    <>
      <CrudListLayout
        title="Quizzes"
        subtitle="Create and manage quizzes with answer keys"
        onAdd={handleAdd}
        addLabel="Create Quiz"
        isLoading={loading}
        error={error}
        itemsLength={quizzes.length}
        emptyTitle="No quizzes yet"
        emptyDescription="Create your first quiz to start grading"
        emptyActionLabel="Create your first quiz"
      >
        <DataTable columns={getQuizColumns({ onEdit: handleEdit, onDelete: handleDelete })} data={quizzes} searchColumn="name" />
      </CrudListLayout>

      <QuizFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        quiz={editingQuiz}
        mode={dialogMode}
        classes={classes}
      />
    </>
  );
}
