import { useEffect, useState } from "react";
import { useForm, type SubmitHandler, type Resolver } from "react-hook-form";
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
import { IconPlus, IconTrash } from "@tabler/icons-react";
import type { Quiz } from "../types/quizzes.types";

const answerSchema = z.object({
  question_id: z.number().min(1, "Question ID must be positive"),
  correct: z.string().regex(/^[A-E]$/, "Answer must be A, B, C, D, or E"),
  points: z.number().min(0, "Points must be non-negative").default(1),
});

const quizSchema = z.object({
  name: z.string().min(1, "Quiz name is required"),
  description: z.string().optional(),
  template_id: z.string(),
  class_id: z.string().min(1, "Class is required"),
  scheduled_date: z.string().optional(),
  due_date: z.string().optional(),
  status: z.enum(["draft", "active", "completed", "archived"]).default("draft"),
  answers: z.array(answerSchema).min(1, "At least one answer is required"),
});

type QuizFormData = z.infer<typeof quizSchema>;
type Answer = z.infer<typeof answerSchema>;

interface QuizFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: QuizFormData) => Promise<boolean>;
  quiz?: Quiz;
  mode: "create" | "edit";
  classes?: Array<{ _id: string; name: string; class_id: string }>;
}

export function QuizFormDialog({
  open,
  onOpenChange,
  onSubmit,
  quiz,
  mode,
  classes = [],
}: QuizFormDialogProps) {
  const [answers, setAnswers] = useState<Answer[]>([]);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema) as unknown as Resolver<QuizFormData>,
    defaultValues: {
      status: "draft",
      template_id: "form_60q",
      answers: [],
    },
  });

  const templateId = watch("template_id");

  // Generate answer key based on template
  const generateAnswerKey = (template: string) => {
    const questionCount = template === "form_60q" ? 60 : 50;
    const newAnswers: Answer[] = [];
    for (let i = 1; i <= questionCount; i++) {
      newAnswers.push({
        question_id: i,
        correct: "A",
        points: 1,
      });
    }
    setAnswers(newAnswers);
    setValue("answers", newAnswers);
  };

  useEffect(() => {
    if (quiz && mode === "edit") {
      setValue("name", quiz.name);
      setValue("description", quiz.description || "");
      setValue("template_id", quiz.template_id);
      // Safely set class_id if available (could be string or populated object)
      if (quiz.class_id) {
        const cid = typeof quiz.class_id === "string"
          ? quiz.class_id
          : (typeof quiz.class_id === "object" && "_id" in quiz.class_id)
            ? (quiz.class_id as { _id: string })._id
            : "";
        setValue("class_id", cid);
      } else {
        setValue("class_id", "");
      }
      setValue("status", quiz.status);
      
      if (quiz.scheduled_date) {
        const date = new Date(quiz.scheduled_date);
        setValue("scheduled_date", date.toISOString().split("T")[0]);
      }
      if (quiz.due_date) {
        const date = new Date(quiz.due_date);
        setValue("due_date", date.toISOString().split("T")[0]);
      }
      
      // Load existing answers
      if (quiz.answers && quiz.answers.length > 0) {
        setAnswers(quiz.answers);
        setValue("answers", quiz.answers);
      }
    } else {
      reset({
        name: "",
        description: "",
        template_id: "form_A",
        class_id: "",
        scheduled_date: "",
        due_date: "",
        status: "draft",
        answers: [],
      });
      setAnswers([]);
    }
  }, [quiz, mode, setValue, reset]);

  const updateAnswer = (index: number, field: keyof Answer, value: string | number) => {
    const newAnswers = [...answers];
    if (field === "question_id" || field === "points") {
      newAnswers[index][field] = Number(value);
    } else {
      newAnswers[index][field] = value as string;
    }
    setAnswers(newAnswers);
    setValue("answers", newAnswers);
  };

  const addAnswer = () => {
    const newAnswer: Answer = {
      question_id: answers.length + 1,
      correct: "A",
      points: 1,
    };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    setValue("answers", newAnswers);
  };

  const removeAnswer = (index: number) => {
    const newAnswers = answers.filter((_, i) => i !== index);
    setAnswers(newAnswers);
    setValue("answers", newAnswers);
  };

  const onSubmitForm: SubmitHandler<QuizFormData> = async (data) => {
    const success = await onSubmit(data);
    if (success) {
      reset();
      setAnswers([]);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-175">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create Quiz" : "Edit Quiz"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new quiz with an answer key. All fields marked with * are required."
              : "Update quiz information. Changes will be saved immediately."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          {/* Quiz ID is auto-generated on the backend; no input required */}

          <div className="space-y-2">
            <Label htmlFor="name">
              Quiz Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g., Midterm Exam, Chapter 5 Quiz"
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
              placeholder="Brief description of the quiz content"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template_id">
                Template <span className="text-destructive">*</span>
              </Label>
              <select
                id="template_id"
                {...register("template_id")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="form_A">Form A (50 questions)</option>
                <option value="form_B">Form B (50 questions)</option>
                <option value="form_60q">Form 60Q (60 questions)</option>
              </select>
              {errors.template_id && (
                <p className="text-sm text-destructive">{errors.template_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register("status")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="class_id">
              Class <span className="text-destructive">*</span>
            </Label>
            <select
              id="class_id"
              {...register("class_id")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              <option value="">Select a class</option>
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.name} ({cls.class_id})
                </option>
              ))}
            </select>
            {errors.class_id && (
              <p className="text-sm text-destructive">{errors.class_id.message}</p>
            )}
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">Schedule</h4>
              <Badge variant="outline">Optional</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduled_date">Scheduled Date</Label>
                <Input
                  id="scheduled_date"
                  type="date"
                  {...register("scheduled_date")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  {...register("due_date")}
                />
              </div>
            </div>
          </div>

          {/* Answer Key Section */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Answer Key</h4>
                <span className="text-destructive">*</span>
                <Badge variant="secondary">{answers.length} questions</Badge>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => generateAnswerKey(templateId || "form_A")}
                >
                  Generate Template
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAnswer}
                >
                  <IconPlus className="h-4 w-4" />
                  Add Question
                </Button>
              </div>
            </div>

            {errors.answers && (
              <p className="text-sm text-destructive">
                {errors.answers.message || "Answer key is required"}
              </p>
            )}

            {answers.length > 0 ? (
              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                <div className="grid grid-cols-[80px_1fr_80px_60px] gap-2 text-sm font-medium text-muted-foreground">
                  <div>Question</div>
                  <div>Correct Answer</div>
                  <div>Points</div>
                  <div></div>
                </div>
                {answers.map((answer, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-[80px_1fr_80px_60px] gap-2 items-center"
                  >
                    <Input
                      type="number"
                      min="1"
                      value={answer.question_id}
                      onChange={(e) =>
                        updateAnswer(index, "question_id", e.target.value)
                      }
                      className="h-8"
                    />
                    <select
                      value={answer.correct}
                      onChange={(e) =>
                        updateAnswer(index, "correct", e.target.value)
                      }
                      className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={answer.points}
                      onChange={(e) =>
                        updateAnswer(index, "points", e.target.value)
                      }
                      className="h-8"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAnswer(index)}
                      className="h-8 w-8 p-0"
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No answer key defined. Click "Generate Template" to create a template or "Add
                Question" to add manually.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Quiz" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
