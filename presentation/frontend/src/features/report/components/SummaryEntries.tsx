import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSections } from "@/features/sections/hooks/useSections";
import type { Section } from "@/features/sections/types/sections.types";
import { useStudents } from "@/features/students/hooks/useStudents";
import type { Student } from "@/features/students/types/students.types";
import { useScans } from "@/features/scans/hooks/useScans";
import type { Scan } from "@packages/types/scans/scans.types";

export interface SummaryEntriesProps {
  sectionIds: string[];
  classId?: string;
}

export const SummaryEntries: React.FC<SummaryEntriesProps> = ({ sectionIds, classId }) => {
  const { sections } = useSections();
  const { students } = useStudents();
  const { scans } = useScans();

  const sectionRows = sectionIds
    .map((sid) => sections.find((s: Section) => s._id === sid))
    .filter((s): s is Section => Boolean(s));

  let totalStudents = 0;
  let totalScans = 0;
  let gradedScans = 0;

  for (const section of sectionRows) {
    const sectionStudents = students.filter((st: Student) =>
      st.section_id === section._id || (Array.isArray(st.class_ids) && classId && st.class_ids.includes(classId))
    );
    totalStudents += sectionStudents.length;
    const sectionScans = scans.filter((sc: Scan) => sectionStudents.some((st: Student) => st._id === sc.student_id));
    totalScans += sectionScans.length;
    gradedScans += sectionScans.filter((s: Scan) => s.status === "graded").length;
  }

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Total Students</p>
              <p className="text-lg font-bold">{totalStudents}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Scans</p>
              <p className="text-lg font-bold">{totalScans}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Graded Scans</p>
              <p className="text-lg font-bold">{gradedScans}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryEntries;
