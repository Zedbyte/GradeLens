import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { IconCheck, IconClock, IconAlertCircle } from "@tabler/icons-react";
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
      <Card>
        <CardHeader>
          <CardTitle>Scan Details</CardTitle>
          <CardDescription>Select a scan to view details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <p className="text-sm text-muted-foreground">No scan selected</p>
            <p className="text-xs text-muted-foreground">Select a scan from the queue to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scan Details</CardTitle>
        <CardDescription>Review scan information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Student</Label>
            <p className="text-sm font-medium">
              {student ? `${student.first_name} ${student.last_name}` : "Unknown"}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Quiz</Label>
            <p className="text-sm font-medium">{quiz?.name || "Unknown"}</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="flex items-center gap-2">
              {scan.status === "graded" && (
                <Badge variant="default" className="flex items-center gap-1">
                  <IconCheck className="h-3 w-3" />
                  Graded
                </Badge>
              )}
              {scan.status === "processing" && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <IconClock className="h-3 w-3" />
                  Processing
                </Badge>
              )}
              {scan.status === "failed" && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <IconAlertCircle className="h-3 w-3" />
                  Failed
                </Badge>
              )}
              {scan.status === "queued" && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <IconClock className="h-3 w-3" />
                  Queued
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Confidence Score</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(scan.confidence || 0) * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {((scan.confidence || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Detected Answers</Label>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">
                {typeof scan.results === 'number' ? scan.results : 0} answers detected
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Sheet Preview</Label>
            <div className="aspect-[3/4] rounded-lg border bg-muted flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Preview not available</p>
            </div>
          </div>

          <Button 
            className="w-full" 
            disabled={scan.status !== "reviewed"}
            onClick={onSave}
          >
            <IconCheck className="mr-2 h-4 w-4" />
            Save Scan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
