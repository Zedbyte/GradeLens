import type { ColumnDef } from "@tanstack/react-table";
import type { Exam } from "../types/exams.types";
import { Button } from "@/components/ui/button";
import { IconEdit, IconTrash, IconClipboard } from "@tabler/icons-react";

export type ExamColumnActions = {
  onEdit: (q: Exam) => void;
  onDelete: (id: string, name: string) => void;
};

export function getExamColumns({ onEdit, onDelete }: ExamColumnActions): ColumnDef<Exam>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
    },
    {
      accessorKey: "question_count",
      header: "Questions",
      cell: ({ row }) => <div className="flex items-center gap-2"><IconClipboard className="size-4"/>{row.getValue("question_count")}</div>
    },
    {
      accessorKey: "total_points",
      header: "Points",
    },
    {
      accessorKey: "template_id",
      header: "Template",
    },
    {
      accessorKey: "scheduled_date",
      header: "Scheduled",
      cell: ({ row }) => {
        const v = row.getValue("scheduled_date") as string | undefined;
        return <div>{v ? new Date(v).toLocaleDateString() : "Not scheduled"}</div>;
      },
    },
    {
      id: "actions",
      enableHiding: false,
      header: "Actions",
      cell: ({ row }) => {
        const exam = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(exam)}>
              <IconEdit className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(exam._id, exam.name)}>
              <IconTrash className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}

export default getExamColumns;
