import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGrades } from "@/features/grades/hooks/useGrades";
import { useClasses } from "@/features/classes/hooks/useClasses";
import PLEntries from "@/features/report/components/PLEntries";
import type { Class as ClassType } from "@/features/classes/types/classes.types";
import type { Grade as GradeType } from "@/features/grades/types/grades.types";
import ItemEntries from "@/features/report/components/ItemEntries";
import SummaryEntries from "@/features/report/components/SummaryEntries";
import { IconChartBar, IconClipboardList, IconGauge } from "@tabler/icons-react";

export default function ReportPage() {
    const [selectedGrade, setSelectedGrade] = useState<string>("");
    const [selectedClass, setSelectedClass] = useState<string>("");

    const { grades, loadGrades } = useGrades();
    const { classes, loadClasses } = useClasses();

    useEffect(() => {
        loadGrades();
        loadClasses();
        // intentionally run once on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const availableClasses = useMemo(() => {
        if (!selectedGrade) return [] as ClassType[];
        function getRefId(ref: unknown): string | undefined {
        if (typeof ref === "string") return ref;
        if (ref && typeof ref === "object") {
            const r = ref as Record<string, unknown>;
            if (typeof r._id === "string") return r._id;
        }
        return undefined;
        }

        return classes.filter((c: ClassType) => {
        const gid = getRefId(c.grade_id);
        return gid === selectedGrade;
        }) as ClassType[];
    }, [classes, selectedGrade]);

    const handleGradeChange = (value: string) => {
        setSelectedGrade(value);
        setSelectedClass("");
    };

    const isReady = Boolean(selectedGrade && selectedClass);

    const currentClass = useMemo(() => classes.find((c: ClassType) => c._id === selectedClass), [classes, selectedClass]);

    const sectionIds: string[] = useMemo(() => {
        if (!currentClass) return [];
        if (Array.isArray(currentClass.section_ids)) return currentClass.section_ids || [];
        return [];
    }, [currentClass]);

    return (
        <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary/10">
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
            <div className="flex items-center justify-between">
                <div>
                <h1 className="text-4xl font-bold tracking-tight text-foreground">Assessment Report</h1>
                <p className="mt-2 text-base text-muted-foreground">Comprehensive analysis of student performance across all sections</p>
                </div>
            </div>
            </div>

            {/* Filters Section */}
            <Card className="mb-8 border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2 min-w-50">
                            <label className="text-sm font-semibold text-foreground">Grade</label>
                            <Select value={selectedGrade} onValueChange={handleGradeChange}>
                            <SelectTrigger className="bg-background w-full">
                                <SelectValue placeholder="Select a grade" />
                            </SelectTrigger>
                            <SelectContent>
                                {grades.map((g: GradeType) => (
                                    <SelectItem key={g._id} value={g._id}>{g.name || g._id}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2 min-w-50">
                            <label className="text-sm font-semibold text-foreground">Class</label>
                            <Select value={selectedClass} onValueChange={setSelectedClass} disabled={!selectedGrade}>
                            <SelectTrigger className="bg-background w-full">
                                <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableClasses.map((classItem: ClassType) => (
                                <SelectItem key={classItem._id} value={classItem._id}>{classItem.name || classItem.class_id || classItem._id}</SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-1 flex-col gap-2">
                            <label className="text-sm font-semibold text-foreground">Academic Year</label>
                            <div className="rounded-md border border-border bg-background px-3 py-2 text-sm">2024-2025</div>
                        </div>

                        <div className="flex flex-1 items-end">
                            <Button disabled={!isReady} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Generate Report</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
            </Card>

            {isReady && (
            <Tabs defaultValue="pl-entries" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pl-entries">
                        <IconGauge />
                        PL-Entries
                    </TabsTrigger>
                    <TabsTrigger value="item-entries">
                        <IconChartBar />
                        Item-Entries
                    </TabsTrigger>
                    <TabsTrigger value="summary">
                        <IconClipboardList />
                        Summary
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pl-entries" className="mt-6">
                <PLEntries sectionIds={sectionIds} classId={selectedClass} />
                </TabsContent>

                <TabsContent value="item-entries" className="mt-6">
                <ItemEntries sectionIds={sectionIds} classId={selectedClass} />
                </TabsContent>

                <TabsContent value="summary" className="mt-6">
                <SummaryEntries sectionIds={sectionIds} classId={selectedClass} />
                </TabsContent>
            </Tabs>
            )}
        </div>
        </div>
    );
}
