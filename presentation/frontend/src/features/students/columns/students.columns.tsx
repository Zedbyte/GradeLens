import type { ColumnDef } from "@tanstack/react-table";
import type { Student } from "../types/students.types";
import { Button } from "@/components/ui/button";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";

export type StudentColumnActions = {
  onEdit: (s: Student) => void;
  onDelete: (id: string) => void;
};

export function getStudentColumns({ onEdit, onDelete }: StudentColumnActions): ColumnDef<Student>[] {
  return [
    {
      id: "name",
      header: "Name",
      accessorFn: (row) => `${row.first_name} ${row.last_name}`,
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "student_id",
      header: "ID",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.getValue("status") === "active" ? "default" : row.getValue("status") === "graduated" ? "secondary" : "outline"}
        >
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      header: "Actions",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(student)}>
              <IconEdit className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(student._id)}>
              <IconTrash className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}

export default getStudentColumns;
