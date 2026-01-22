import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IconCheck, IconClock, IconAlertCircle, IconInfoCircle } from "@tabler/icons-react";
import type { Scan } from "@/features/scans/types/scans.types";
import type { Quiz } from "@/features/quizzes/types/quizzes.types";
import type { Student } from "@/features/students/types/students.types";

interface ScanDetailsProps {
  scan?: Scan;
  quiz?: Quiz;
  student?: Student;
  onSave?: () => void;
}

export function ScanDetails({ scan, quiz, student, onSave }: ScanDetailsProps) {
  if (!scan) {
    return (
      <Card className="border-0 shadow-sm">
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

  return (
    <Card className="border-0 shadow-sm pt-0">
      <CardHeader className="border-b bg-muted/30 py-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">Scan Details</CardTitle>
            <CardDescription className="text-xs">ID: {scan.scan_id}</CardDescription>
          </div>
          <Badge variant={statusInfo.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <ScrollArea className="h-[calc(100vh-280px)]">
        <CardContent className="space-y-4 pt-4">
          {/* Student & Quiz Info */}
          {(student || quiz) && (
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              {student && (
                <div className="mb-2">
                  <span className="font-medium">Student:</span>{" "}
                  {student.first_name} {student.last_name}
                </div>
              )}
              {quiz && (
                <div>
                  <span className="font-medium">Quiz:</span> {quiz.name}
                </div>
              )}
            </div>
          )}

          {/* Processing Status */}
          {(scan.status === "processing" || scan.status === "queued") && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
              <IconClock className="h-4 w-4 animate-spin" />
              <span className="font-medium">Processing scan, please wait...</span>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-destructive">Errors</h4>
              {errors.map((error, i: number) => (
                <div key={i} className="rounded-lg border border-destructive/20 bg-destructive/5 p-2 text-xs">
                  <div className="font-medium">{error.code}</div>
                  <div className="text-muted-foreground">{error.message}</div>
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-amber-600">Warnings</h4>
              {warnings.map((warning, i: number) => (
                <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs">
                  <div className="font-medium text-amber-900">{warning.code}</div>
                  <div className="text-amber-700">{warning.message}</div>
                </div>
              ))}
            </div>
          )}

          {/* Statistics */}
          {detections.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Statistics</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border bg-muted/30 p-2">
                  <div className="text-muted-foreground">Total Questions</div>
                  <div className="text-lg font-bold">{stats.total}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2">
                  <div className="text-muted-foreground">Answered</div>
                  <div className="text-lg font-bold text-green-600">{stats.answered}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2">
                  <div className="text-muted-foreground">Unanswered</div>
                  <div className="text-lg font-bold text-gray-500">{stats.unanswered}</div>
                </div>
                <div className="rounded-lg border bg-muted/30 p-2">
                  <div className="text-muted-foreground">Avg Confidence</div>
                  <div className="text-lg font-bold">{(stats.avgConfidence * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}

          {/* Quality Metrics */}
          {qualityMetrics && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Quality Metrics</h4>
              <div className="space-y-1 rounded-lg border bg-muted/30 p-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blur Score:</span>
                  <span className="font-mono">{qualityMetrics.blur_score?.toFixed(1) || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brightness:</span>
                  <span className="font-mono">
                    {qualityMetrics.brightness_mean?.toFixed(1)} ± {qualityMetrics.brightness_std?.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Skew Angle:</span>
                  <span className="font-mono">{qualityMetrics.skew_angle?.toFixed(2)}°</span>
                </div>
                {qualityMetrics.perspective_correction_applied && (
                  <div className="pt-1 text-xs text-green-600">✓ Perspective corrected</div>
                )}
              </div>
            </div>
          )}

          {/* Processing Time */}
          {scan.processing_time_ms && (
            <div className="text-xs text-muted-foreground">
              Processing time: <span className="font-mono">{scan.processing_time_ms.toFixed(0)}ms</span>
            </div>
          )}

          {/* Question Detections */}
          {detections.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Detected Answers</h4>
              <ScrollArea className="h-75 rounded-lg border">
                <div className="space-y-1 p-2">
                  {detections.map((detection) => (
                    <div
                      key={detection.question_id}
                      className={`flex items-center justify-between rounded border p-2 text-xs ${
                        detection.detection_status === "answered"
                          ? "bg-green-50 border-green-200"
                          : detection.detection_status === "ambiguous"
                          ? "bg-amber-50 border-amber-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">Q{detection.question_id}</span>
                        {detection.selected.length > 0 ? (
                          <Badge variant="outline" className="h-5 text-xs">
                            {detection.selected.join(", ")}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-muted-foreground">
                          {((detection.confidence || 0) * 100).toFixed(0)}%
                        </span>
                        {detection.detection_status === "answered" && (
                          <IconCheck className="h-3 w-3 text-green-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Save Button */}
          {onSave && (
            <Button
              onClick={onSave}
              disabled={scan.status !== "detected" && scan.status !== "graded"}
              className="w-full"
            >
              Save Results
            </Button>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
