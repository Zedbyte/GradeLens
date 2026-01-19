import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Class } from "../types/classes.types";

const classSchema = z.object({
  class_id: z.string().min(1, "Class ID is required"),
  name: z.string().min(1, "Class name is required"),
  academic_year: z.string().min(1, "Academic year is required"),
  section: z.string().optional(),
  subject: z.string().optional(),
  status: z.enum(["active", "completed", "archived"]).default("active"),
});

type ClassFormData = z.infer<typeof classSchema>;

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ClassFormData) => Promise<boolean>;
  classData?: Class;
  mode: "create" | "edit";
}

export function ClassFormDialog({
  open,
  onOpenChange,
  onSubmit,
  classData,
  mode,
}: ClassFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<ClassFormData>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      status: "active",
    },
  });

  useEffect(() => {
    if (classData && mode === "edit") {
      setValue("class_id", classData.class_id);
      setValue("name", classData.name);
      setValue("academic_year", classData.academic_year);
      setValue("section", classData.section || "");
      setValue("subject", classData.subject || "");
      setValue("status", classData.status);
    } else {
      reset({
        class_id: "",
        name: "",
        academic_year: new Date().getFullYear().toString(),
        section: "",
        subject: "",
        status: "active",
      });
    }
  }, [classData, mode, setValue, reset]);

  const onSubmitForm = async (data: ClassFormData) => {
    const success = await onSubmit(data);
    if (success) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Class" : "Edit Class"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new class to organize students. All fields marked with * are required."
              : "Update class information. Changes will be saved immediately."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class_id">
              Class ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="class_id"
              {...register("class_id")}
              placeholder="e.g., CS101-2024, MATH-A-2024"
              disabled={mode === "edit"}
            />
            {errors.class_id && (
              <p className="text-sm text-destructive">{errors.class_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Class Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Computer Science 101, Mathematics A"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="academic_year">
              Academic Year <span className="text-destructive">*</span>
            </Label>
            <Input
              id="academic_year"
              {...register("academic_year")}
              placeholder="e.g., 2024, 2024-2025"
            />
            {errors.academic_year && (
              <p className="text-sm text-destructive">{errors.academic_year.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                {...register("subject")}
                placeholder="e.g., Mathematics"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                {...register("section")}
                placeholder="e.g., A, B, 1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              {...register("status")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Class" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
