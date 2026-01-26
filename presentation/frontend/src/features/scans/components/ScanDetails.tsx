import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconCheck, IconClock, IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";
import { toast } from "sonner";
import type { Scan } from "@packages/types/scans/scans.types";;
import type { Quiz } from "@/features/quizzes/types/quizzes.types";
import type { Student } from "@/features/students/types/students.types";
import { EditAnswersDialog } from "./EditAnswersDialog";
import { ViewAdvancedDialog } from "./ViewAdvancedDialog";
import { ScanDetailsContent } from "./ScanDetailsContent";

interface ScanDetailsProps {
  scan?: Scan;
  quiz?: Quiz;
  student?: Student;
  onSave?: () => void;
  className?: string;
}

export function ScanDetails({ scan, quiz, student, onSave, className }: ScanDetailsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<number, string[]>>({});

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
  const handleSaveEdits = () => {
    // TODO: Send edited answers to backend
    console.log("Saving edited answers:", editedAnswers);
    setIsEditMode(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditedAnswers({});
    setIsEditMode(false);
    // Don't close the dialog, just exit edit mode
  };

  if (!scan) {
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

  const detections = scan.detection_result?.detections || [];
  const qualityMetrics = scan.detection_result?.quality_metrics;
  const warnings = scan.detection_result?.warnings || [];
  const errors = scan.detection_result?.errors || [];

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

  const statusInfo = statusConfig[scan.status as keyof typeof statusConfig] || {
    variant: "secondary" as const,
    icon: IconInfoCircle,
    label: scan.status
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
              {scan.filename}
            </CardDescription>
          </div>
          
          <Badge variant={statusInfo.variant}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="pb-4 space-y-5">
          {/* View Advanced Dialog */}
          <ViewAdvancedDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            scan={scan}
            warnings={warnings}
            qualityMetrics={qualityMetrics}
            statusInfo={statusInfo}
            failedImages={failedImages}
            onImageError={handleImageError}
          />

          <ScanDetailsContent
            scan={scan}
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
      />

      {/* Fixed Save Button */}
      {onSave && (
        <CardContent className="pt-3 pb-4 border-t shrink-0">
          <Button
            onClick={onSave}
            disabled={scan.status !== "detected" && scan.status !== "graded"}
            className="w-full"
          >
            Save Results
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
