import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { IconCheck, IconClock, IconAlertCircle, IconInfoCircle, IconArrowRight, IconPhotoOff } from "@tabler/icons-react";
import type { Scan } from "@/features/scans/types/scans.types";
import type { Quiz } from "@/features/quizzes/types/quizzes.types";
import type { Student } from "@/features/students/types/students.types";

interface ScanDetailsProps {
  scan?: Scan;
  quiz?: Quiz;
  student?: Student;
  onSave?: () => void;
  className?: string;
}

export function ScanDetails({ scan, quiz, student, onSave, className }: ScanDetailsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (imagePath: string) => {
    setFailedImages(prev => new Set(prev).add(imagePath));
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

  // Render scan details content
  const renderScanContent = (isDialog = false) => (
    <div className={`space-y-${isDialog ? '6' : '4'}`}>
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

      {/* Statistics */}
      {detections.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Statistics</h4>
          <div className={`grid ${isDialog ? 'grid-cols-4' : 'grid-cols-2'} gap-2 text-xs`}>
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
          <ScrollArea className={isDialog ? "h-96" : "h-75"}>
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 p-2">
              {detections.map((detection) => (
                <div
                  key={detection.question_id}
                  className={`relative flex flex-col items-center justify-center rounded-lg border p-1 text-xs transition-all hover:shadow-md ${
                    detection.detection_status === "answered"
                      ? "bg-green-50 border-green-300 hover:border-green-400"
                      : detection.detection_status === "ambiguous"
                      ? "bg-amber-50 border-amber-300 hover:border-amber-400"
                      : "bg-gray-50 border-gray-300 hover:border-gray-400"
                  }`}
                  title={`Confidence: ${((detection.confidence || 0) * 100).toFixed(0)}%`}
                >
                  {detection.detection_status === "answered" && (
                    <IconCheck className="absolute top-1 right-1 h-3 w-3 text-green-600" />
                  )}
                  <span className="font-mono font-bold text-sm mb-1">Q{detection.question_id}</span>
                  {detection.selected.length > 0 ? (
                    <span className="font-mono font-semibold text-base">
                      {detection.selected.join(", ")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-base">—</span>
                  )}
                  <span className="font-mono text-[10px] text-muted-foreground mt-1">
                    {((detection.confidence || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {/* Advanced: Pipeline Visualization (Dialog Only) */}
      {isDialog && scan.detection_result?.pipeline_images && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="pipeline" className="border rounded-lg px-4">
            <AccordionTrigger className="text-sm font-semibold hover:no-underline">
              Advanced: Pipeline Visualization
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {/* Pipeline Images Grid */}
                <div className="flex flex-wrap items-center gap-3">
                  {scan.detection_result.pipeline_images.original && (
                    <>
                      {failedImages.has(scan.detection_result.pipeline_images.original) ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-medium text-muted-foreground text-center">Original</div>
                          <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                            <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                            <span className="text-xs text-destructive/70 text-center">Image not found</span>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.original}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                        >
                          <div className="text-xs font-medium text-muted-foreground text-center">Original</div>
                          <img 
                            src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.original}`}
                            alt="Original"
                            className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                            loading="lazy"
                            onError={() => handleImageError(scan.detection_result!.pipeline_images!.original!)}
                          />
                        </a>
                      )}
                      {scan.detection_result.pipeline_images.grayscale && (
                        <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </>
                  )}
                  
                  {scan.detection_result.pipeline_images.grayscale && (
                    <>
                      {failedImages.has(scan.detection_result.pipeline_images.grayscale) ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-medium text-muted-foreground text-center">Grayscale</div>
                          <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                            <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                            <span className="text-xs text-destructive/70 text-center">Image not found</span>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.grayscale}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                        >
                          <div className="text-xs font-medium text-muted-foreground text-center">Grayscale</div>
                          <img 
                            src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.grayscale}`}
                            alt="Grayscale"
                            className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                            loading="lazy"
                            onError={() => handleImageError(scan.detection_result!.pipeline_images!.grayscale!)}
                          />
                        </a>
                      )}
                      {scan.detection_result.pipeline_images.clahe && (
                        <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </>
                  )}
                  
                  {scan.detection_result.pipeline_images.clahe && (
                    <>
                      {failedImages.has(scan.detection_result.pipeline_images.clahe) ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-medium text-muted-foreground text-center">CLAHE</div>
                          <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                            <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                            <span className="text-xs text-destructive/70 text-center">Image not found</span>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.clahe}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                        >
                          <div className="text-xs font-medium text-muted-foreground text-center">CLAHE</div>
                          <img 
                            src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.clahe}`}
                            alt="CLAHE"
                            className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                            loading="lazy"
                            onError={() => handleImageError(scan.detection_result!.pipeline_images!.clahe!)}
                          />
                        </a>
                      )}
                      {scan.detection_result.pipeline_images.binary && (
                        <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </>
                  )}
                  
                  {scan.detection_result.pipeline_images.binary && (
                    <>
                      {failedImages.has(scan.detection_result.pipeline_images.binary) ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-medium text-muted-foreground text-center">Binary</div>
                          <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                            <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                            <span className="text-xs text-destructive/70 text-center">Image not found</span>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.binary}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                        >
                          <div className="text-xs font-medium text-muted-foreground text-center">Binary</div>
                          <img 
                            src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.binary}`}
                            alt="Binary"
                            className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                            loading="lazy"
                            onError={() => handleImageError(scan.detection_result!.pipeline_images!.binary!)}
                          />
                        </a>
                      )}
                      {scan.detection_result.pipeline_images.paper_detection && (
                        <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </>
                  )}
                </div>
                
                {/* Second Row */}
                <div className="flex flex-wrap items-center gap-3">
                  {scan.detection_result.pipeline_images.paper_detection && (
                    <>
                      {failedImages.has(scan.detection_result.pipeline_images.paper_detection) ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-medium text-muted-foreground text-center">Paper Detection</div>
                          <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                            <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                            <span className="text-xs text-destructive/70 text-center">Image not found</span>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.paper_detection}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                        >
                          <div className="text-xs font-medium text-muted-foreground text-center">Paper Detection</div>
                          <img 
                            src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.paper_detection}`}
                            alt="Paper Detection"
                            className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                            loading="lazy"
                            onError={() => handleImageError(scan.detection_result!.pipeline_images!.paper_detection!)}
                          />
                        </a>
                      )}
                      {scan.detection_result.pipeline_images.perspective_corrected && (
                        <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </>
                  )}
                  
                  {scan.detection_result.pipeline_images.perspective_corrected && (
                    <>
                      {failedImages.has(scan.detection_result.pipeline_images.perspective_corrected) ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-medium text-muted-foreground text-center">Perspective</div>
                          <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                            <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                            <span className="text-xs text-destructive/70 text-center">Image not found</span>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.perspective_corrected}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                        >
                          <div className="text-xs font-medium text-muted-foreground text-center">Perspective</div>
                          <img 
                            src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.perspective_corrected}`}
                            alt="Perspective Corrected"
                            className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                            loading="lazy"
                            onError={() => handleImageError(scan.detection_result!.pipeline_images!.perspective_corrected!)}
                          />
                        </a>
                      )}
                      {scan.detection_result.pipeline_images.aligned && (
                        <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </>
                  )}
                  
                  {scan.detection_result.pipeline_images.aligned && (
                    <>
                      {failedImages.has(scan.detection_result.pipeline_images.aligned) ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-medium text-muted-foreground text-center">Aligned</div>
                          <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                            <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                            <span className="text-xs text-destructive/70 text-center">Image not found</span>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.aligned}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                        >
                          <div className="text-xs font-medium text-muted-foreground text-center">Aligned</div>
                          <img 
                            src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.aligned}`}
                            alt="Template Aligned"
                            className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                            loading="lazy"
                            onError={() => handleImageError(scan.detection_result!.pipeline_images!.aligned!)}
                          />
                        </a>
                      )}
                      {scan.detection_result.pipeline_images.roi_extraction && (
                        <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </>
                  )}
                  
                  {scan.detection_result.pipeline_images.roi_extraction && (
                    <>
                      {failedImages.has(scan.detection_result.pipeline_images.roi_extraction) ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-medium text-muted-foreground text-center">ROI Extraction</div>
                          <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                            <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                            <span className="text-xs text-destructive/70 text-center">Image not found</span>
                          </div>
                        </div>
                      ) : (
                        <a
                          href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.roi_extraction}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                        >
                          <div className="text-xs font-medium text-muted-foreground text-center">ROI Extraction</div>
                          <img 
                            src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.roi_extraction}`}
                            alt="ROI Extraction"
                            className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                            loading="lazy"
                            onError={() => handleImageError(scan.detection_result!.pipeline_images!.roi_extraction!)}
                          />
                        </a>
                      )}
                      {scan.detection_result.pipeline_images.fill_scoring && (
                        <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </>
                  )}
                </div>
                
                {/* Third Row (if needed) */}
                {scan.detection_result.pipeline_images.fill_scoring && (
                  <div className="flex flex-wrap items-center gap-3">
                    {failedImages.has(scan.detection_result.pipeline_images.fill_scoring) ? (
                      <div className="flex flex-col items-center gap-1">
                        <div className="text-xs font-medium text-muted-foreground text-center">Fill Scoring</div>
                        <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                          <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                          <span className="text-xs text-destructive/70 text-center">Image not found</span>
                        </div>
                      </div>
                    ) : (
                      <a
                        href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.fill_scoring}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                      >
                        <div className="text-xs font-medium text-muted-foreground text-center">Fill Scoring</div>
                        <img 
                          src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.fill_scoring}`}
                          alt="Fill Scoring & Detection"
                          className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                          loading="lazy"
                          onError={() => handleImageError(scan.detection_result!.pipeline_images!.fill_scoring!)}
                        />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );

  return (
    <Card
      className={cn(
        "shadow-sm flex flex-col h-full",
        className
      )}
    >
      <CardHeader className="border-b bg-muted/30 py-3 shrink-0">
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

      <ScrollArea className="flex-1">
        <CardContent className="pt-4 space-y-4">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                View Advanced
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl min-w-200 max-h-[90vh] p-8">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle>Advanced Scan Details</DialogTitle>
                    <DialogDescription>Pipeline Visualization & Quality Metrics - ID: {scan.scan_id}</DialogDescription>
                  </div>
                  <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </DialogHeader>
              <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
                <div className="space-y-6">
                  {/* Warnings */}
                  {warnings.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold text-amber-600">Warnings</h4>
                      <div className="space-y-2">
                        {warnings.map((warning, i: number) => (
                          <div key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                            <div className="font-semibold text-amber-900">{warning.code}</div>
                            <div className="text-amber-700">{warning.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quality Metrics */}
                  {qualityMetrics && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold">Quality Metrics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="text-sm text-muted-foreground mb-2">Blur Score</div>
                          <div className="text-2xl font-mono font-bold">{qualityMetrics.blur_score?.toFixed(1) || "N/A"}</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="text-sm text-muted-foreground mb-2">Brightness</div>
                          <div className="text-2xl font-mono font-bold">
                            {qualityMetrics.brightness_mean?.toFixed(1)} ± {qualityMetrics.brightness_std?.toFixed(1)}
                          </div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="text-sm text-muted-foreground mb-2">Skew Angle</div>
                          <div className="text-2xl font-mono font-bold">{qualityMetrics.skew_angle?.toFixed(2)}°</div>
                        </div>
                        <div className="rounded-lg border bg-muted/30 p-4">
                          <div className="text-sm text-muted-foreground mb-2">Perspective Correction</div>
                          <div className="text-xl font-bold">
                            {qualityMetrics.perspective_correction_applied ? (
                              <span className="text-green-600">✓ Applied</span>
                            ) : (
                              <span className="text-muted-foreground">Not Applied</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Processing Time */}
                  {scan.processing_time_ms && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="text-sm text-muted-foreground mb-2">Processing Time</div>
                      <div className="text-2xl font-mono font-bold">{scan.processing_time_ms.toFixed(0)}ms</div>
                    </div>
                  )}

                  {/* Pipeline Visualization */}
                  {scan.detection_result?.pipeline_images && (
                    <div className="space-y-3">
                      <h4 className="text-base font-semibold">Pipeline Visualization</h4>
                      <div className="space-y-4">
                        {/* Pipeline Images Grid */}
                        <div className="flex flex-wrap items-center gap-3">
                          {scan.detection_result.pipeline_images.original && (
                            <>
                              {failedImages.has(scan.detection_result.pipeline_images.original) ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground mb-1">Original</span>
                                  <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                                    <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                                    <span className="text-xs text-destructive/70 text-center">Image not found</span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.original}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                                >
                                  <span className="text-xs text-muted-foreground mb-1">Original</span>
                                  <img 
                                    src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.original}`}
                                    alt="Original"
                                    className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                                    loading="lazy"
                                    onError={() => handleImageError(scan.detection_result!.pipeline_images!.original!)}
                                  />
                                </a>
                              )}
                              {scan.detection_result.pipeline_images.grayscale && (
                                <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                            </>
                          )}
                          
                          {scan.detection_result.pipeline_images.grayscale && (
                            <>
                              {failedImages.has(scan.detection_result.pipeline_images.grayscale) ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground mb-1">Grayscale</span>
                                  <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                                    <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                                    <span className="text-xs text-destructive/70 text-center">Image not found</span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.grayscale}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                                >
                                  <span className="text-xs text-muted-foreground mb-1">Grayscale</span>
                                  <img 
                                    src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.grayscale}`}
                                    alt="Grayscale"
                                    className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                                    loading="lazy"
                                    onError={() => handleImageError(scan.detection_result!.pipeline_images!.grayscale!)}
                                  />
                                </a>
                              )}
                              {scan.detection_result.pipeline_images.clahe && (
                                <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                            </>
                          )}
                          
                          {scan.detection_result.pipeline_images.clahe && (
                            <>
                              {failedImages.has(scan.detection_result.pipeline_images.clahe) ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground mb-1">CLAHE</span>
                                  <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                                    <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                                    <span className="text-xs text-destructive/70 text-center">Image not found</span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.clahe}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                                >
                                  <span className="text-xs text-muted-foreground mb-1">CLAHE</span>
                                  <img 
                                    src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.clahe}`}
                                    alt="CLAHE"
                                    className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                                    loading="lazy"
                                    onError={() => handleImageError(scan.detection_result!.pipeline_images!.clahe!)}
                                  />
                                </a>
                              )}
                              {scan.detection_result.pipeline_images.binary && (
                                <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                            </>
                          )}
                          
                          {scan.detection_result.pipeline_images.binary && (
                            <>
                              {failedImages.has(scan.detection_result.pipeline_images.binary) ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground mb-1">Binary</span>
                                  <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                                    <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                                    <span className="text-xs text-destructive/70 text-center">Image not found</span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.binary}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                                >
                                  <span className="text-xs text-muted-foreground mb-1">Binary</span>
                                  <img 
                                    src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.binary}`}
                                    alt="Binary"
                                    className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                                    loading="lazy"
                                    onError={() => handleImageError(scan.detection_result!.pipeline_images!.binary!)}
                                  />
                                </a>
                              )}
                              {scan.detection_result.pipeline_images.paper_detection && (
                                <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Second Row */}
                        <div className="flex flex-wrap items-center gap-3">
                          {scan.detection_result.pipeline_images.paper_detection && (
                            <>
                              {failedImages.has(scan.detection_result.pipeline_images.paper_detection) ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground mb-1">Paper Detection</span>
                                  <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                                    <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                                    <span className="text-xs text-destructive/70 text-center">Image not found</span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.paper_detection}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                                >
                                  <span className="text-xs text-muted-foreground mb-1">Paper Detection</span>
                                  <img 
                                    src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.paper_detection}`}
                                    alt="Paper Detection"
                                    className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                                    loading="lazy"
                                    onError={() => handleImageError(scan.detection_result!.pipeline_images!.paper_detection!)}
                                  />
                                </a>
                              )}
                              {scan.detection_result.pipeline_images.perspective_corrected && (
                                <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                            </>
                          )}
                          
                          {scan.detection_result.pipeline_images.perspective_corrected && (
                            <>
                              {failedImages.has(scan.detection_result.pipeline_images.perspective_corrected) ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground mb-1">Perspective Corrected</span>
                                  <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                                    <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                                    <span className="text-xs text-destructive/70 text-center">Image not found</span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.perspective_corrected}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                                >
                                  <span className="text-xs text-muted-foreground mb-1">Perspective Corrected</span>
                                  <img 
                                    src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.perspective_corrected}`}
                                    alt="Perspective Corrected"
                                    className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                                    loading="lazy"
                                    onError={() => handleImageError(scan.detection_result!.pipeline_images!.perspective_corrected!)}
                                  />
                                </a>
                              )}
                              {scan.detection_result.pipeline_images.aligned && (
                                <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                            </>
                          )}
                          
                          {scan.detection_result.pipeline_images.aligned && (
                            <>
                              {failedImages.has(scan.detection_result.pipeline_images.aligned) ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground mb-1">Aligned</span>
                                  <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                                    <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                                    <span className="text-xs text-destructive/70 text-center">Image not found</span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.aligned}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                                >
                                  <span className="text-xs text-muted-foreground mb-1">Aligned</span>
                                  <img 
                                    src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.aligned}`}
                                    alt="Aligned"
                                    className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                                    loading="lazy"
                                    onError={() => handleImageError(scan.detection_result!.pipeline_images!.aligned!)}
                                  />
                                </a>
                              )}
                              {scan.detection_result.pipeline_images.roi_extraction && (
                                <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                            </>
                          )}
                          
                          {scan.detection_result.pipeline_images.roi_extraction && (
                            <>
                              {failedImages.has(scan.detection_result.pipeline_images.roi_extraction) ? (
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs text-muted-foreground mb-1">ROI Extraction</span>
                                  <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                                    <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                                    <span className="text-xs text-destructive/70 text-center">Image not found</span>
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.roi_extraction}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                                >
                                  <span className="text-xs text-muted-foreground mb-1">ROI Extraction</span>
                                  <img 
                                    src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.roi_extraction}`}
                                    alt="ROI Extraction"
                                    className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                                    loading="lazy"
                                    onError={() => handleImageError(scan.detection_result!.pipeline_images!.roi_extraction!)}
                                  />
                                </a>
                              )}
                              {scan.detection_result.pipeline_images.fill_scoring && (
                                <IconArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Third Row (if needed) */}
                        {scan.detection_result.pipeline_images.fill_scoring && (
                          <div className="flex flex-wrap items-center gap-3">
                            {failedImages.has(scan.detection_result.pipeline_images.fill_scoring) ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-xs text-muted-foreground mb-1">Fill Scoring & Detection</span>
                                <div className="w-32 h-32 rounded border-2 border-destructive/20 bg-destructive/5 flex flex-col items-center justify-center gap-2 p-2">
                                  <IconPhotoOff className="h-8 w-8 text-destructive/50" />
                                  <span className="text-xs text-destructive/70 text-center">Image not found</span>
                                </div>
                              </div>
                            ) : (
                              <a
                                href={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.fill_scoring}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col items-center gap-1 transition-transform hover:scale-105"
                              >
                                <span className="text-xs text-muted-foreground mb-1">Fill Scoring & Detection</span>
                                <img 
                                  src={`${import.meta.env.VITE_CV_SERVICE_URL}/storage/${scan.detection_result.pipeline_images.fill_scoring}`}
                                  alt="Fill Scoring & Detection"
                                  className="w-32 h-32 object-cover rounded border-2 border-border bg-white shadow-sm group-hover:border-primary transition-colors cursor-pointer"
                                  loading="lazy"
                                  onError={() => handleImageError(scan.detection_result!.pipeline_images!.fill_scoring!)}
                                />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          {renderScanContent(false)}
        </CardContent>
      </ScrollArea>

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

