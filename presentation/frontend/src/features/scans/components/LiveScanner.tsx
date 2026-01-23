import { useCallback, useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  IconCamera, 
  IconCapture, 
  IconRefresh, 
  IconAlertCircle,
  IconCheck
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { previewFrameApi } from "../api/scans.api";
import type { Template } from "@/types/template.types";
import type { FramePreviewResponse } from "../types/scans.types";

interface LiveScannerProps {
  selectedQuiz?: string;
  selectedStudent?: string;
  template?: Template;
  onCapture: (imageData: string) => void;
}

const VIDEO_CONSTRAINTS = {
  width: { ideal: 1920 },
  height: { ideal: 1080 },
  facingMode: "environment", // Use rear camera on mobile
};

export function LiveScanner({
  selectedQuiz,
  selectedStudent,
  template,
  onCapture,
}: LiveScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewIntervalRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string>("");
  const [preview, setPreview] = useState<FramePreviewResponse | null>(null);
  const [showDebugImages, setShowDebugImages] = useState(false);

  // Stop preview when component unmounts
  useEffect(() => {
    return () => {
      if (previewIntervalRef.current) {
        clearInterval(previewIntervalRef.current);
      }
    };
  }, []);

  const drawOverlay = useCallback((previewData: FramePreviewResponse) => {
    const canvas = canvasRef.current;
    const video = webcamRef.current?.video;
    if (!canvas || !video || !template) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate scale factor from template to video
    const scaleX = canvas.width / template.canonical_size.width;
    const scaleY = canvas.height / template.canonical_size.height;

    // Draw template guide (paper boundary)
    ctx.strokeStyle = previewData.paper_detected ? "#22c55e" : "#f97316";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 5]);
    
    const guidePadding = 20;
    ctx.strokeRect(
      guidePadding,
      guidePadding,
      canvas.width - guidePadding * 2,
      canvas.height - guidePadding * 2
    );
    ctx.setLineDash([]);

    // Draw detected paper contours (live edge detection)
    if (previewData.paper_corners && previewData.paper_corners.length === 4) {
      const corners = previewData.paper_corners;
      
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 10;
      
      // Draw detected paper boundary
      ctx.beginPath();
      corners.forEach((corner, i) => {
        const x = corner.x * scaleX;
        const y = corner.y * scaleY;
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.stroke();
      
      // Draw corner circles
      ctx.shadowBlur = 0;
      corners.forEach((corner) => {
        const x = corner.x * scaleX;
        const y = corner.y * scaleY;
        
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // Draw registration mark detection zones (ZipGrade-style)
    if (template.registration_marks) {
      template.registration_marks.forEach((mark) => {
        const x = mark.position.x * scaleX;
        const y = mark.position.y * scaleY;
        const markSize = (mark.size || 20) * Math.min(scaleX, scaleY);
        
        // Detection zone size (much larger area for dynamic detection - 8x instead of 3x)
        // This allows users to position paper without precise alignment
        const zoneSize = markSize * 8;
        
        // Check if this mark was detected
        const isDetected = previewData.detected_marks?.some(
          detected => {
            const dx = Math.abs(detected.x * scaleX - x);
            const dy = Math.abs(detected.y * scaleY - y);
            return dx < zoneSize && dy < zoneSize;
          }
        );
        
        // Determine which corner this mark is in to position zone correctly
        // Marks should be at the corners/edges of the paper
        const isLeft = mark.position.x < template.canonical_size.width / 2;
        const isTop = mark.position.y < template.canonical_size.height / 2;
        
        // Adjust zone position to extend toward the corner
        let zoneX = x;
        let zoneY = y;
        
        // Position the zone so it extends toward the actual corner
        if (isLeft) {
          zoneX = x - zoneSize / 4; // Shift left toward edge
        } else {
          zoneX = x + zoneSize / 4; // Shift right toward edge
        }
        
        if (isTop) {
          zoneY = y - zoneSize / 4; // Shift up toward edge
        } else {
          zoneY = y + zoneSize / 4; // Shift down toward edge
        }
        
        // Draw zone box at the adjusted position
        const zoneLeft = zoneX - zoneSize / 2;
        const zoneTop = zoneY - zoneSize / 2;
        
        // Draw detection zone box (semi-transparent background)
        ctx.fillStyle = isDetected ? "rgba(34, 197, 94, 0.15)" : "rgba(59, 130, 246, 0.15)";
        ctx.fillRect(zoneLeft, zoneTop, zoneSize, zoneSize);
        
        // Draw zone border
        ctx.strokeStyle = isDetected ? "#22c55e" : "#3b82f6";
        ctx.lineWidth = 3;
        ctx.globalAlpha = 0.7;
        ctx.strokeRect(zoneLeft, zoneTop, zoneSize, zoneSize);
        
        // Draw corner brackets (ZipGrade-style) - larger and more prominent
        const bracketLength = zoneSize * 0.25;
        const bracketThickness = 4;
        ctx.lineWidth = bracketThickness;
        ctx.globalAlpha = 0.9;
        
        // Top-left bracket
        ctx.beginPath();
        ctx.moveTo(zoneLeft, zoneTop + bracketLength);
        ctx.lineTo(zoneLeft, zoneTop);
        ctx.lineTo(zoneLeft + bracketLength, zoneTop);
        ctx.stroke();
        
        // Top-right bracket
        ctx.beginPath();
        ctx.moveTo(zoneLeft + zoneSize - bracketLength, zoneTop);
        ctx.lineTo(zoneLeft + zoneSize, zoneTop);
        ctx.lineTo(zoneLeft + zoneSize, zoneTop + bracketLength);
        ctx.stroke();
        
        // Bottom-left bracket
        ctx.beginPath();
        ctx.moveTo(zoneLeft, zoneTop + zoneSize - bracketLength);
        ctx.lineTo(zoneLeft, zoneTop + zoneSize);
        ctx.lineTo(zoneLeft + bracketLength, zoneTop + zoneSize);
        ctx.stroke();
        
        // Bottom-right bracket
        ctx.beginPath();
        ctx.moveTo(zoneLeft + zoneSize - bracketLength, zoneTop + zoneSize);
        ctx.lineTo(zoneLeft + zoneSize, zoneTop + zoneSize);
        ctx.lineTo(zoneLeft + zoneSize, zoneTop + zoneSize - bracketLength);
        ctx.stroke();
        
        // Draw expected mark position (small circle/square in center)
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 1;
        
        if (mark.type === "circle") {
          ctx.beginPath();
          ctx.arc(x, y, markSize, 0, 2 * Math.PI);
          ctx.stroke();
        } else {
          ctx.strokeRect(x - markSize / 2, y - markSize / 2, markSize, markSize);
        }
        
        // Draw label with background for better visibility
        const labelText = mark.id.replace("_", " ").toUpperCase();
        ctx.font = "bold 16px sans-serif";
        const textMetrics = ctx.measureText(labelText);
        const textWidth = textMetrics.width;
        const textHeight = 20;
        const labelX = zoneLeft + 10;
        const labelY = zoneTop + 10;
        
        // Label background
        ctx.fillStyle = isDetected ? "rgba(34, 197, 94, 0.9)" : "rgba(59, 130, 246, 0.9)";
        ctx.globalAlpha = 0.9;
        ctx.fillRect(labelX - 5, labelY - textHeight + 5, textWidth + 10, textHeight);
        
        // Label text
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 1.0;
        ctx.fillText(labelText, labelX, labelY);
        
        ctx.globalAlpha = 1.0;
        ctx.globalAlpha = 1.0;
      });
    }

    // Draw detected registration marks (filled circle with checkmark)
    if (previewData.detected_marks) {
      previewData.detected_marks.forEach((mark) => {
        const detectedX = mark.x * scaleX;
        const detectedY = mark.y * scaleY;
        
        // Outer glow
        ctx.fillStyle = "#22c55e";
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(detectedX, detectedY, 15, 0, 2 * Math.PI);
        ctx.fill();
        
        // Inner circle
        ctx.fillStyle = "#22c55e";
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(detectedX, detectedY, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // Checkmark
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1.0;
        ctx.beginPath();
        ctx.moveTo(detectedX - 4, detectedY);
        ctx.lineTo(detectedX - 1, detectedY + 3);
        ctx.lineTo(detectedX + 4, detectedY - 3);
        ctx.stroke();
        
        ctx.globalAlpha = 1.0;
      });
    }

    // Draw quality feedback
    if (previewData.quality_feedback) {
      const feedback = previewData.quality_feedback;
      let yOffset = 40;

      ctx.font = "bold 18px sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;

      const drawText = (text: string, color: string) => {
        ctx.fillStyle = color;
        ctx.strokeText(text, 20, yOffset);
        ctx.fillText(text, 20, yOffset);
        yOffset += 30;
      };

      if (feedback.blur_detected) {
        drawText("⚠ Image is blurry", "#f97316");
      }
      if (feedback.too_dark) {
        drawText("⚠ Too dark", "#f97316");
      }
      if (feedback.too_bright) {
        drawText("⚠ Too bright", "#f97316");
      }
      if (feedback.skewed) {
        drawText("⚠ Paper is skewed", "#f97316");
      }
      if (feedback.ready_to_scan) {
        drawText("✓ Ready to scan", "#22c55e");
      }
    }
  }, [template]);

  const stopPreview = useCallback(() => {
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
    setPreview(null);
  }, []);

  const startPreview = useCallback(() => {
    if (!template) return;

    // Send frame every 500ms for preview
    previewIntervalRef.current = window.setInterval(async () => {
      if (!webcamRef.current || !template) return;

      try {
        const imageSrc = webcamRef.current.getScreenshot();
        if (!imageSrc) return;

        // Extract base64 data
        const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, "");
        
        const result = await previewFrameApi({
          image: base64Data,
          template_id: template.template_id,
        });

        setPreview(result);
        drawOverlay(result);
      } catch (err) {
        console.error("Preview error:", err);
      }
    }, 500);
  }, [template, drawOverlay]);

  // Start/stop preview based on ready state
  useEffect(() => {
    if (isReady && template) {
      startPreview();
      return () => stopPreview();
    }
  }, [isReady, template, startPreview, stopPreview]);

  const handleCapture = useCallback(() => {
    if (!webcamRef.current || !selectedQuiz || !selectedStudent) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      // Extract base64 data without the data URL prefix
      const base64Data = imageSrc.replace(/^data:image\/\w+;base64,/, "");
      onCapture(base64Data);
    }
  }, [selectedQuiz, selectedStudent, onCapture]);

  const handleUserMedia = useCallback(() => {
    setIsReady(true);
    setError("");
  }, []);

  const handleUserMediaError = useCallback((err: string | DOMException) => {
    setIsReady(false);
    const errorMessage = typeof err === "string" 
      ? err 
      : err.message || "Failed to access camera";
    setError(errorMessage);
    console.error("Camera error:", err);
  }, []);

  const canCapture = selectedQuiz && selectedStudent && isReady;

  return (
    <div className="space-y-4">
      {/* Status Indicators */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isReady ? "default" : "secondary"}>
            <IconCamera className="mr-1 h-3 w-3" />
            {isReady ? "Camera Active" : "Initializing..."}
          </Badge>
          {template && (
            <Badge variant="outline">
              Template: {template.name}
            </Badge>
          )}
          {preview?.paper_detected && (
            <Badge variant="default" className="bg-green-500">
              <IconCheck className="mr-1 h-3 w-3" />
              Paper Detected
            </Badge>
          )}
        </div>
        
        {preview && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              Marks: {preview.marks_detected || 0}/{template?.registration_marks.length || 4}
            </span>
            {preview.quality_score !== undefined && (
              <span className={cn(
                "font-medium",
                preview.quality_score > 0.7 ? "text-green-500" : "text-orange-500"
              )}>
                Quality: {(preview.quality_score * 100).toFixed(0)}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Warnings */}
      {!template && (
        <Alert>
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select an assessment to load the template guide
          </AlertDescription>
        </Alert>
      )}

      {!selectedQuiz && (
        <Alert>
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a quiz before scanning
          </AlertDescription>
        </Alert>
      )}

      {!selectedStudent && (
        <Alert>
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a student before scanning
          </AlertDescription>
        </Alert>
      )}

      {/* Camera Preview with Overlay */}
      <div className="relative aspect-3/4 w-full overflow-hidden rounded-lg border-2 border-dashed bg-muted">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={VIDEO_CONSTRAINTS}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="h-full w-full object-cover"
          mirrored={false}
        />
        
        {/* Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full pointer-events-none"
        />

        {/* Ready indicator */}
        {preview?.quality_feedback?.ready_to_scan && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="rounded-full bg-green-500 p-4 shadow-lg">
              <IconCheck className="h-12 w-12 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          onClick={handleCapture}
          disabled={!canCapture}
          className="flex-1"
          size="lg"
        >
          <IconCapture className="mr-2 h-5 w-5" />
          Capture Scan
        </Button>
        
        <Button
          onClick={() => {
            setError("");
            setIsReady(false);
            // Webcam will reinitialize
          }}
          variant="outline"
          size="lg"
        >
          <IconRefresh className="h-5 w-5" />
        </Button>
      </div>

      {/* Preview Info */}
      {preview && (
        <div className="rounded-lg border bg-card p-3 text-sm space-y-1">
          <div className="font-medium">Detection Status:</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            <div>Paper: {preview.paper_detected ? "✓ Detected" : "✗ Not found"}</div>
            <div>Marks: {preview.marks_detected || 0} detected</div>
            <div>Blur Score: {preview.blur_score?.toFixed(2) || "N/A"}</div>
            <div>Brightness: {preview.brightness?.toFixed(0) || "N/A"}</div>
          </div>
          
          {/* Debug Images Toggle */}
          {(preview.original_image || preview.grayscale_image || preview.clahe_image || preview.preprocessed_image || preview.warped_image) && (
            <div className="mt-3 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugImages(!showDebugImages)}
                className="w-full"
              >
                {showDebugImages ? "Hide" : "Show"} Preprocessing Images
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Preprocessing Debug Images */}
      {showDebugImages && preview && (preview.original_image || preview.grayscale_image || preview.clahe_image || preview.preprocessed_image || preview.warped_image) && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="font-medium">OMR Vision Pipeline:</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {preview.original_image && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  1. Original Image
                </div>
                <img
                  src={`data:image/jpeg;base64,${preview.original_image}`}
                  alt="Original"
                  className="w-full rounded border"
                />
                <p className="text-xs text-muted-foreground">
                  Raw camera input (BGR color)
                </p>
              </div>
            )}
            
            {preview.grayscale_image && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  2. Grayscale
                </div>
                <img
                  src={`data:image/jpeg;base64,${preview.grayscale_image}`}
                  alt="Grayscale"
                  className="w-full rounded border"
                />
                <p className="text-xs text-muted-foreground">
                  Converted to grayscale for processing
                </p>
              </div>
            )}
            
            {preview.clahe_image && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  3. CLAHE Enhanced
                </div>
                <img
                  src={`data:image/jpeg;base64,${preview.clahe_image}`}
                  alt="CLAHE"
                  className="w-full rounded border"
                />
                <p className="text-xs text-muted-foreground">
                  Contrast Limited Adaptive Histogram Equalization - makes shades more visible
                </p>
              </div>
            )}
            
            {preview.preprocessed_image && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  4. Binarized (Black & White)
                </div>
                <img
                  src={`data:image/jpeg;base64,${preview.preprocessed_image}`}
                  alt="Preprocessed"
                  className="w-full rounded border"
                />
                <p className="text-xs text-muted-foreground">
                  Final binary image - Otsu or Adaptive Threshold based on lighting
                </p>
              </div>
            )}
            
            {preview.warped_image && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  5. Perspective Corrected
                </div>
                <img
                  src={`data:image/jpeg;base64,${preview.warped_image}`}
                  alt="Warped"
                  className="w-full rounded border"
                />
                <p className="text-xs text-muted-foreground">
                  Warped to canonical view - ready for ROI extraction
                </p>
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <strong>Complete Pipeline:</strong> Original → Grayscale → CLAHE (Contrast) → 
            Gaussian Blur → Paper Detection → Perspective Correction → Mark Detection → 
            ROI Extraction → Fill Detection → Grading
          </div>
        </div>
      )}
    </div>
  );
}
