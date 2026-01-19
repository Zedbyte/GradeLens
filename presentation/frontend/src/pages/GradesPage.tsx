import { useEffect, useState } from "react";
import { useGrades } from "../features/grades/hooks/useGrades";
import { GradeFormDialog } from "../features/grades/components/GradeFormDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import type { CreateGradeRequest, Grade, UpdateGradeRequest } from "../features/grades/types/grades.types";

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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {grades.map((grade) => (
            <Card key={grade._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{grade.name}</CardTitle>
                    <CardDescription>
                      <Badge variant="secondary" className="mt-2">
                        Level {grade.level}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(grade)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(grade)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">ID:</span> {grade.grade_id}
                  </div>
                  {grade.description && (
                    <div className="text-sm text-muted-foreground">
                      {grade.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
