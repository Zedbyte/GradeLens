import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconEdit, IconTrash, IconUsers } from "@tabler/icons-react";
import { useClasses } from "@/features/classes/hooks/useClasses";
import { ClassFormDialog } from "@/features/classes/components/ClassFormDialog";
import { useGrades } from "@/features/grades/hooks/useGrades";
import { useSections } from "@/features/sections/hooks/useSections";
import type { Class, CreateClassRequest, UpdateClassRequest } from "@/features/classes/types/classes.types";

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

      <Card>
        <CardHeader>
          <CardTitle>Class List</CardTitle>
          <CardDescription>
            {total > 0 ? `${total} classes found` : "No classes yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading classes...</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No classes yet</p>
                <p className="text-sm">Create your first class to organize students</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {classes.map((cls) => (
                <div
                  key={cls._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{cls.name}</h3>
                      <Badge
                        variant={
                          cls.status === "active"
                            ? "default"
                            : cls.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {cls.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                      <span>ID: {cls.class_id}</span>
                      <span>Academic Year: {cls.academic_year}</span>
                      {cls.subject && <span>Subject: {cls.subject}</span>}
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                      <IconUsers className="size-4" />
                      <span>{cls.student_count || 0} students</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cls)}>
                      <IconEdit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(cls._id, cls.name)}
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
