import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconCheck, IconClock, IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import { useScans } from "../hooks/useScans";
import { EditAnswersDialog } from "./EditAnswersDialog";
import { ViewAdvancedDialog } from "./ViewAdvancedDialog";
import { ScanDetailsContent } from "./ScanDetailsContent";
import type { Quiz } from "@/features/quizzes";
import type { Student } from "@/features/students";

interface ScanDetailsProps {
  onSave?: () => void;
  onRedoScan?: () => void;
  className?: string;
  quizzes?: Quiz[];
  students?: Student[];
}

export function ScanDetails({ onSave, onRedoScan, className, quizzes, students }: ScanDetailsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<number, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingReviewed, setIsMarkingReviewed] = useState(false);

  // Get scan from Zustand store
  const { selectedScan, updateScanAnswers, markScanAsReviewed, isPollingRequest, error } = useScans();

  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (error && lastErrorRef.current !== error) {
      toast.error("Scan update failed", { description: error });
      lastErrorRef.current = error;
    }
  }, [error]);
  
  // quizzes and students are passed from parent to avoid duplicate hook state
  const localQuizzes = quizzes || [];
  const localStudents = students || [];

  const handleImageError = (imagePath: string) => {
    setFailedImages(prev => new Set(prev).add(imagePath));
  };

  // Initialize edited answers from detection results
  const initializeEditedAnswers = () => {
    if (!detections.length) return;
    const initial: Record<number, string[]> = {};
    detections.forEach((detection) => {
      initial[detection.question_id] = [...detection.selected];
    });
    setEditedAnswers(initial);
  };

  // Handle answer selection toggle
  const toggleAnswer = (questionId: number, option: string) => {
    setEditedAnswers(prev => {
      const current = prev[questionId] || [];
      const newAnswers = current.includes(option)
        ? current.filter(a => a !== option)
        : [...current, option];
      return { ...prev, [questionId]: newAnswers };
    });
  };

  // Handle edit mode toggle
  const handleEditModeToggle = () => {
    if (!isEditMode) {
      initializeEditedAnswers();
    }
    setIsEditMode(!isEditMode);
  };

  // Open edit dialog
  const handleOpenEditDialog = () => {
    initializeEditedAnswers();
    setIsEditMode(false);
    setEditDialogOpen(true);
  };

  // Save edited answers
  const handleSaveEdits = async () => {
    if (!selectedScan) return;

    setIsSaving(true);
    try {
      await updateScanAnswers(selectedScan.scan_id, { answers: editedAnswers });
      
      toast.success("Answers updated", {
        description: "The scan answers have been successfully updated.",
      });

      setIsEditMode(false);
      
      
      // Trigger parent refresh
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Failed to save edited answers:", error);
      toast("Failed to save", {
        description: error instanceof Error ? error.message : "Failed to update scan answers",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedAnswers({});
    setIsEditMode(false);
    // Don't close the dialog, just exit edit mode
  };

  // Mark scan as reviewed
  const handleMarkAsReviewed = async () => {
    if (!selectedScan) return;

    setIsMarkingReviewed(true);
    try {
      await markScanAsReviewed(selectedScan.scan_id);
      
      toast("Scan marked as reviewed", {
        description: "The scan has been marked as reviewed.",
      });

      // Trigger parent refresh
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error("Failed to mark as reviewed:", error);
      toast("Failed to mark as reviewed", {
        description: error instanceof Error ? error.message : "Failed to mark scan as reviewed",
      });
    } finally {
      setIsMarkingReviewed(false);
    }
  };

  // Redo scan: scroll to top, notify user that quiz/student were auto-selected, then invoke parent handler
  const handleRedoClick = () => {
    if (!selectedScan || !quiz || !student) return;

    // Scroll to top of page to emphasize selection
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      // fallback
      window.scrollTo(0, 0);
    }

    // Notify via sonner that we auto-selected quiz/student
    const quizLabel = quiz ? `${quiz.name}` : "(quiz)";
    const studentLabel = student ? `${student.first_name} ${student.last_name}` : "(student)";

    toast.info("Auto-selected quiz & student", {
      description: `Pre-filled ${quizLabel} for ${studentLabel} — ready to re-upload.`,
    });

    // Call parent handler to switch to upload view / pre-fill selections
    if (onRedoScan) onRedoScan();
  };

  if (!selectedScan) {
    return (
      <Card className={cn(
        "shadow-sm",
        className
      )}>
        <CardContent className="flex min-h-100 items-center justify-center py-12">
          <div className="text-center text-muted-foreground">
            <IconInfoCircle className="mx-auto mb-3 h-12 w-12 opacity-50" />
            <p className="font-medium">No Scan Selected</p>
            <p className="text-sm">Select a scan from the queue to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const detections = selectedScan?.detection_result?.detections || [];
  const qualityMetrics = selectedScan?.detection_result?.quality_metrics;
  const warnings = selectedScan?.detection_result?.warnings || [];
  const errors = selectedScan?.detection_result?.errors || [];

  // Find quiz and student for display
  const quiz = localQuizzes.find(q => q._id === selectedScan.exam_id);
  const student = localStudents.find(s => s._id === selectedScan.student_id);

  // Calculate statistics
  const stats = {
    total: detections.length,
    answered: detections.filter(d => d.detection_status === "answered").length,
    unanswered: detections.filter(d => d.detection_status === "unanswered").length,
    ambiguous: detections.filter(d => d.detection_status === "ambiguous").length,
    avgConfidence: detections.length > 0
      ? detections.reduce((sum, d) => sum + (d.confidence || 0), 0) / detections.length
      : 0
  };

  // Status badge configuration
  const statusConfig = {
    detected: { variant: "default" as const, icon: IconCheck, label: "Detected" },
    graded: { variant: "default" as const, icon: IconCheck, label: "Graded" },
    processing: { variant: "secondary" as const, icon: IconClock, label: "Processing" },
    queued: { variant: "secondary" as const, icon: IconClock, label: "Queued" },
    failed: { variant: "destructive" as const, icon: IconAlertCircle, label: "Failed" },
    error: { variant: "destructive" as const, icon: IconAlertCircle, label: "Error" },
  };

  const statusInfo = statusConfig[selectedScan?.status as keyof typeof statusConfig] || {
    variant: "secondary" as const,
    icon: IconInfoCircle,
    label: selectedScan?.status || "unknown"
  };
  const StatusIcon = statusInfo.icon;

  // Get answer key from quiz for comparison
  const answers = quiz?.answers || [];

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="shrink-0">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-lg">Scan Details</CardTitle>
            <CardDescription className="font-mono text-xs">
              {selectedScan?.filename}
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            {isPollingRequest && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <IconClock className="h-3 w-3 animate-spin" />
                <span>Updating…</span>
              </div>
            )}
            <Badge variant={statusInfo.variant}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="pb-4 space-y-5">
          {/* View Advanced Dialog */}
          <ViewAdvancedDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            scan={selectedScan}
            warnings={warnings}
            qualityMetrics={qualityMetrics}
            statusInfo={statusInfo}
            failedImages={failedImages}
            onImageError={handleImageError}
          />

          <ScanDetailsContent
            scan={selectedScan}
            quiz={quiz}
            student={student}
            detections={detections}
            errors={errors}
            stats={stats}
            isDialog={false}
            onOpenEditDialog={handleOpenEditDialog}
            failedImages={failedImages}
            onImageError={handleImageError}
          />
        </CardContent>
      </ScrollArea>

      {/* Edit Answers Dialog */}
      <EditAnswersDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        isEditMode={isEditMode}
        onEditModeToggle={handleEditModeToggle}
        onSave={handleSaveEdits}
        onCancel={handleCancelEdit}
        detections={detections}
        answers={answers}
        editedAnswers={editedAnswers}
        onToggleAnswer={toggleAnswer}
        isSaving={isSaving}
      />

      {/* Fixed Action Buttons */}
      {(onSave || onRedoScan) && (
        <CardContent className="pt-3 pb-4 border-t shrink-0">
          <div className="flex gap-2">
            {onRedoScan && (
              <Button
                onClick={handleRedoClick}
                variant="outline"
                className="flex-1"
              >
                Redo Scan
              </Button>
            )}
            {onSave && (
              <Button
                onClick={handleMarkAsReviewed}
                disabled={selectedScan?.status === "reviewed" || isMarkingReviewed}
                className="flex-1"
              >
                {isMarkingReviewed ? "Marking..." : "Mark as Reviewed"}
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
