import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconCheck, IconClock, IconAlertCircle } from "@tabler/icons-react";
import type { Scan } from "@/features/scans/types/scans.types";
import type { Quiz } from "@/features/quizzes/types/quizzes.types";
import type { Student } from "@/features/students/types/students.types";

interface ScanQueueProps {
  scans: Scan[];
  selectedScanId?: string;
  onSelect: (id: string) => void;
  quizzes: Quiz[];
  students: Student[];
}

export function ScanQueue({
  scans,
  selectedScanId,
  onSelect,
  quizzes,
  students,
}: ScanQueueProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          Scan Queue
          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-bold">
            {scans.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {scans.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No scans in queue</p>
        )}
        
        {scans.map((scan) => {
          const quiz = quizzes.find((q) => q._id === scan.exam_id);
          const student = students.find((s) => s._id === scan.student_id);
          
          return (
            <button
              key={scan.scan_id}
              onClick={() => onSelect(scan.scan_id)}
              className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${
                selectedScanId === scan.scan_id
                  ? 'bg-primary/5 border-primary/50'
                  : 'bg-background border-border hover:bg-secondary/40'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-foreground">
                    {student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {quiz?.name || 'Unknown Quiz'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {scan.status === 'graded' && <IconCheck className="h-4 w-4 text-green-500" />}
                  {scan.status === 'processing' && (
                    <IconClock className="h-4 w-4 animate-pulse text-primary" />
                  )}
                  {scan.status === 'failed' && <IconAlertCircle className="h-4 w-4 text-destructive" />}
                  {scan.status === 'queued' && (
                    <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
