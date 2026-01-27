import { useEffect, useState } from "react";
import { useGrades } from "../features/grades/hooks/useGrades";
import { GradeFormDialog } from "../features/grades/components/GradeFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import type { CreateGradeRequest, Grade, UpdateGradeRequest } from "../features/grades/types/grades.types";
import DataTable from "@/components/data-table";
import getGradeColumns from "../features/grades/columns/grades.columns";

export function GradesPage() {
  const { grades, loading, error, loadGrades, createGrade, updateGrade, deleteGrade } = useGrades();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<Grade | undefined>();
  const [mode, setMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const handleCreate = () => {
    setSelectedGrade(undefined);
    setMode("create");
    setIsDialogOpen(true);
  };

  const handleEdit = (grade: Grade) => {
    setSelectedGrade(grade);
    setMode("edit");
    setIsDialogOpen(true);
  };

  const handleDelete = async (grade: Grade) => {
    if (window.confirm(`Are you sure you want to deactivate ${grade.name}?`)) {
      await deleteGrade(grade._id);
    }
  };

  const handleSubmit = async (data: CreateGradeRequest | UpdateGradeRequest) => {
    if (mode === "create") {
      return await createGrade(data as CreateGradeRequest);
    } else if (selectedGrade) {
      return await updateGrade(selectedGrade._id, data as UpdateGradeRequest);
    }
    return false;
  };

  if (loading && grades.length === 0) {
    return <div className="p-8">Loading grades...</div>;
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
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Grades</h1>
          <p className="text-muted-foreground">Manage grade levels for your school</p>
        </div>
        <Button onClick={handleCreate}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Grade
        </Button>
      </div>

      {grades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No grades yet</p>
            <Button onClick={handleCreate} variant="outline">
              <IconPlus className="mr-2 h-4 w-4" />
              Create your first grade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={getGradeColumns({ onEdit: handleEdit, onDelete: handleDelete })} data={grades} searchColumn="name" />
      )}

      <GradeFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        grade={selectedGrade}
        mode={mode}
      />
    </div>
  );
}
