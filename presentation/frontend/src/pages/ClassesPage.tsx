import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useClasses } from "@/features/classes/hooks/useClasses";
import { ClassFormDialog } from "@/features/classes/components/ClassFormDialog";
import { useGrades } from "@/features/grades/hooks/useGrades";
import { useSections } from "@/features/sections/hooks/useSections";
import type { Class, CreateClassRequest, UpdateClassRequest } from "@/features/classes/types/classes.types";
import DataTable from "@/components/data-table";
import getClassColumns from "@/features/classes/columns/classes.columns";

export default function ClassesPage() {
  const { classes, loading, error, total, loadClasses, createClass, updateClass, deleteClass } = useClasses();
  const { grades, loadGrades } = useGrades();
  const { sections, loadSections } = useSections();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | undefined>();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    loadClasses();
    loadGrades();
    loadSections();
  }, [loadClasses, loadGrades, loadSections]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to archive ${name}?`)) {
      await deleteClass(id);
    }
  };

  const handleAdd = () => {
    setEditingClass(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (classData: Class) => {
    setEditingClass(classData);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateClassRequest | UpdateClassRequest) => {
    if (dialogMode === "create") {
      return await createClass(data as CreateClassRequest);
    } else if (editingClass) {
      return await updateClass(editingClass._id, data as UpdateClassRequest);
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Classes</h1>
          <p className="text-muted-foreground">Organize students into classes and sections</p>
        </div>
        <Button onClick={handleAdd}>
          <IconPlus className="mr-2 size-4" />
          Create Class
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {classes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No classes yet</p>
            <Button onClick={handleAdd} variant="outline">
              <IconPlus className="mr-2 size-4" />
              Create your first class
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={getClassColumns({ onEdit: handleEdit, onDelete: handleDelete })} data={classes} searchColumn="name" />
      )}

      <ClassFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        classData={editingClass}
        mode={dialogMode}
        grades={grades}
        sections={sections}
      />
    </div>
  );
}
