import { useEffect, useState } from "react";
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import { useStudents } from "@/features/students/hooks/useStudents";
import { StudentFormDialog } from "@/features/students/components/StudentFormDialog";
import { useGrades } from "@/features/grades/hooks/useGrades";
import { useSections } from "@/features/sections/hooks/useSections";
import type { CreateStudentRequest, Student, UpdateStudentRequest } from "@/features/students/types/students.types";
import DataTable from "@/components/data-table";
import getStudentColumns from "@/features/students/columns/students.columns";

export default function StudentsPage() {
  const { students, error, loadStudents, createStudent, updateStudent, deleteStudent } = useStudents();
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

  const handleDelete = async (id: string) => {
    if (confirm(`Are you sure you want to deactivate this student?`)) {
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

      {students.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No students yet</p>
            <Button onClick={handleAdd} variant="outline">
              <IconPlus className="mr-2 size-4" />
              Create your first student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <DataTable columns={getStudentColumns({ onEdit: handleEdit, onDelete: (id) => handleDelete(id) })} data={students} searchColumn="name" />
      )}

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
