import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { useStudents } from "@/features/students/hooks/useStudents";
import { StudentFormDialog } from "@/features/students/components/StudentFormDialog";
import { useGrades } from "@/features/grades/hooks/useGrades";
import { useSections } from "@/features/sections/hooks/useSections";
import type { CreateStudentRequest, Student, UpdateStudentRequest } from "@/features/students/types/students.types";

export default function StudentsPage() {
  const { students, loading, error, total, loadStudents, createStudent, updateStudent, deleteStudent } = useStudents();
  const { grades, loadGrades } = useGrades();
  const { sections, loadSections } = useSections();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    loadStudents();
    loadGrades();
    loadSections();
  }, [loadStudents, loadGrades, loadSections]);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to deactivate ${name}?`)) {
      await deleteStudent(id);
    }
  };

  const handleAdd = () => {
    setEditingStudent(undefined);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleSubmit = async (data: CreateStudentRequest | UpdateStudentRequest) => {
    if (dialogMode === "create") {
      return await createStudent(data as CreateStudentRequest);
    } else if (editingStudent) {
      return await updateStudent(editingStudent._id, data as UpdateStudentRequest);
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="text-muted-foreground">Manage students and their information</p>
        </div>
        <Button onClick={handleAdd}>
          <IconPlus className="mr-2 size-4" />
          Add Student
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
          <CardTitle>Student List</CardTitle>
          <CardDescription>
            {total > 0 ? `${total} students found` : "No students yet"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading students...</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <div className="text-center">
                <p className="text-lg font-medium">No students yet</p>
                <p className="text-sm">Create your first student to get started</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {students.map((student) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {student.first_name} {student.last_name}
                      </h3>
                      <Badge
                        variant={
                          student.status === "active"
                            ? "default"
                            : student.status === "graduated"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {student.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
                      <span>ID: {student.student_id}</span>
                      {student.email && <span>{student.email}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(student)}>
                      <IconEdit className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleDelete(
                          student._id,
                          `${student.first_name} ${student.last_name}`
                        )
                      }
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

      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        student={editingStudent}
        mode={dialogMode}
        grades={grades}
        sections={sections}
      />
    </div>
  );
}
