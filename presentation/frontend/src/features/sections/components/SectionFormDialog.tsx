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
import { Badge } from "@/components/ui/badge";
import type { Section } from "../types/sections.types";
import type { Grade } from "../../grades/types/grades.types";

const sectionSchema = z.object({
  section_id: z.string().min(1, "Section ID is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  grade_id: z.string().optional(),
  capacity: z.number().min(1, "Capacity must be at least 1").optional().or(z.literal(0)),
});

type SectionFormData = z.infer<typeof sectionSchema>;

interface SectionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: SectionFormData) => Promise<boolean>;
  section?: Section;
  mode: "create" | "edit";
  grades?: Grade[];
}

export function SectionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  section,
  mode,
  grades = [],
}: SectionFormDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
  });

  useEffect(() => {
    if (section && mode === "edit") {
      setValue("section_id", section.section_id);
      setValue("name", section.name);
      setValue("description", section.description || "");
      setValue("grade_id", typeof section.grade_id === "string" ? section.grade_id : section.grade_id?._id || "");
      setValue("capacity", section.capacity || 0);
    } else {
      reset({
        section_id: "",
        name: "",
        description: "",
        grade_id: "",
        capacity: 0,
      });
    }
  }, [section, mode, setValue, reset]);

  const onSubmitForm = async (data: SectionFormData) => {
    // Remove empty grade_id and zero capacity
    const submitData = {
      ...data,
      grade_id: data.grade_id || undefined,
      capacity: data.capacity || undefined,
    };
    const success = await onSubmit(submitData);
    if (success) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Section" : "Edit Section"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new section. All fields marked with * are required."
              : "Update section information. Changes will be saved immediately."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="section_id">
              Section ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="section_id"
              {...register("section_id")}
              placeholder="e.g., SEC-A, SEC-B"
              disabled={mode === "edit"}
            />
            {errors.section_id && (
              <p className="text-sm text-destructive">{errors.section_id.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Section A, Einstein, Newton"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register("description")}
              placeholder="Optional description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">Optional Settings</h4>
              <Badge variant="outline">Optional</Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="grade_id">Grade</Label>
              <select
                id="grade_id"
                {...register("grade_id")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="">None (Available to all grades)</option>
                {grades.map((grade) => (
                  <option key={grade._id} value={grade._id}>
                    {grade.name} (Level {grade.level})
                  </option>
                ))}
              </select>
              <p className="text-sm text-muted-foreground">
                Link this section to a specific grade
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                {...register("capacity", { valueAsNumber: true })}
                placeholder="e.g., 30, 40"
                min="0"
              />
              <p className="text-sm text-muted-foreground">
                Maximum number of students (0 = unlimited)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Section" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
