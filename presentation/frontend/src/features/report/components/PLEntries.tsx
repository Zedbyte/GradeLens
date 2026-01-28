// features/report/components/PLEntries.tsx
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconChevronDown } from "@tabler/icons-react";
import { Loading } from "@/components/loading";
import type { PLEntriesSection } from "@/features/report/types/reports.types";

export interface PLEntriesProps {
  sections: PLEntriesSection[];
  isLoading?: boolean;
  error?: string | null;
}

export const PLEntries: React.FC<PLEntriesProps> = ({ 
  sections, 
  isLoading = false,
  error = null 
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loading text="Loading PL Entries..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (sections.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            No sections found for selected class and exam.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Please verify that the class has sections assigned and students have been scanned.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => {
        const { statistics, distribution, metadata } = section;
        const isExpanded = expandedSection === section.section_id;

        return (
          <Card key={section.section_id} className="border-border bg-card/50">
            <button
              onClick={() => setExpandedSection(isExpanded ? null : section.section_id)}
              className="w-full text-left"
            >
              <CardHeader className="cursor-pointer flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground">
                    {section.section_name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metadata.scan_count} of {metadata.student_count} students scanned
                  </p>
                </div>
                <IconChevronDown
                  className={`transition-transform text-muted-foreground ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </CardHeader>
            </button>

            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 mb-6">
                <div className="rounded-lg bg-background p-3 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground">Mean</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {statistics.mean.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-background p-3 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground">PL (%)</p>
                  <p className="mt-1 text-lg font-bold text-primary">
                    {statistics.pl_percentage.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg bg-background p-3 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground">MPS</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {statistics.mps.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-lg bg-background p-3 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground">Total F</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {statistics.total_f}
                  </p>
                </div>
                <div className="rounded-lg bg-background p-3 border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground">Total FX</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {statistics.total_fx}
                  </p>
                </div>
              </div>

              {!isExpanded && (
                <div className="flex items-center justify-center py-6 px-4">
                  <div className="text-center text-muted-foreground text-sm">
                    Click to expand and view detailed score breakdown (
                    {distribution.length} levels)
                  </div>
                </div>
              )}

              {isExpanded && (
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground mb-4">
                    Showing {distribution.length} score levels (out of{" "}
                    {metadata.total_points} total points)
                  </div>

                  <div className="space-y-2 mb-6">
                    <p className="text-xs font-semibold text-foreground mb-3">
                      Distribution (f)
                    </p>
                    <div className="space-y-1">
                      {distribution.slice(0, 20).map((row, idx) => {
                        const maxF =
                          distribution.length > 0
                            ? Math.max(...distribution.map((r) => r.f))
                            : 1;
                        const percentage = maxF > 0 ? (row.f / maxF) * 100 : 0;
                        return (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <div className="w-8 font-mono text-right text-muted-foreground">
                              {row.score}
                            </div>
                            <div className="flex-1 h-6 bg-background rounded border border-border/50 overflow-hidden">
                              <div
                                className="h-full bg-linear-to-r from-primary to-accent"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <div className="w-8 text-right font-semibold text-foreground">
                              {row.f}
                            </div>
                          </div>
                        );
                      })}
                      {distribution.length > 20 && (
                        <div className="pt-2 text-xs text-muted-foreground italic">
                          ... and {distribution.length - 20} more
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <div className="overflow-x-auto max-h-80 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-primary/10">
                          <tr className="border-b border-border">
                            <th className="px-3 py-2 text-left font-semibold text-foreground">
                              Score
                            </th>
                            <th className="px-3 py-2 text-center font-semibold text-foreground">
                              f
                            </th>
                            <th className="px-3 py-2 text-center font-semibold text-foreground">
                              fx
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {distribution.map((row, idx) => (
                            <tr
                              key={idx}
                              className="border-b border-border/30 hover:bg-secondary/10"
                            >
                              <td className="px-3 py-2 font-medium text-foreground">
                                {row.score}
                              </td>
                              <td className="px-3 py-2 text-center text-foreground">
                                {row.f}
                              </td>
                              <td className="px-3 py-2 text-center text-foreground">
                                {row.fx}
                              </td>
                            </tr>
                          ))}
                          <tr className="border-t-2 border-primary bg-primary/5">
                            <td className="px-3 py-2 font-semibold text-primary">
                              Total
                            </td>
                            <td className="px-3 py-2 text-center font-semibold text-primary">
                              {statistics.total_f}
                            </td>
                            <td className="px-3 py-2 text-center font-semibold text-primary">
                              {statistics.total_fx}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PLEntries;