import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSections } from "@/features/sections/hooks/useSections";
import type { Section } from "@/features/sections/types/sections.types";
import { useStudents } from "@/features/students/hooks/useStudents";
import type { Student } from "@/features/students/types/students.types";
import { useScans } from "@/features/scans/hooks/useScans";
import type { Scan } from "@packages/types/scans/scans.types";

export interface ItemEntriesProps {
  sectionIds: string[];
  classId?: string;
}

export const ItemEntries: React.FC<ItemEntriesProps> = ({ sectionIds, classId }) => {
  const { sections } = useSections();
  const { students } = useStudents();
  const { scans } = useScans();

  const sectionRows = sectionIds
    .map((sid) => sections.find((s: Section) => s._id === sid))
    .filter((s): s is Section => Boolean(s));

  return (
    <div className="space-y-4">
      {sectionRows.length === 0 && <div className="text-sm text-muted-foreground">No sections found for selected class.</div>}

      {sectionRows.map((section) => {
        const sectionStudents = students.filter((st: Student) =>
          st.section_id === section._id || (Array.isArray(st.class_ids) && classId && st.class_ids.includes(classId))
        );
        const totalStudents = sectionStudents.length;
        const totalScans = scans.filter((sc: Scan) => sectionStudents.some((st: Student) => st._id === sc.student_id)).length;

        return (
          <Card key={section._id} className="border-border bg-card/50">
            <CardHeader>
              <CardTitle>{section.name || section.section_id || section._id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Students</p>
                  <p className="text-lg font-bold">{totalStudents}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Scans</p>
                  <p className="text-lg font-bold">{totalScans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ItemEntries;
