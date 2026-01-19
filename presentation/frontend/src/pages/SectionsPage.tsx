import { useEffect, useState } from "react";
import { useSections } from "../features/sections/hooks/useSections";
import { useGrades } from "../features/grades/hooks/useGrades";
import { SectionFormDialog } from "../features/sections/components/SectionFormDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconPlus, IconEdit, IconTrash, IconUsers } from "@tabler/icons-react";
import type { CreateSectionRequest, Section, UpdateSectionRequest } from "../features/sections/types/sections.types";

export function SectionsPage() {
  const { sections, loading, error, loadSections, createSection, updateSection, deleteSection } = useSections();
  const { grades, loadGrades } = useGrades();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<Section | undefined>();
  const [mode, setMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    loadSections();
    loadGrades();
  }, [loadSections, loadGrades]);

  const handleCreate = () => {
    setSelectedSection(undefined);
    setMode("create");
    setIsDialogOpen(true);
  };

  const handleEdit = (section: Section) => {
    setSelectedSection(section);
    setMode("edit");
    setIsDialogOpen(true);
  };

  const handleDelete = async (section: Section) => {
    if (window.confirm(`Are you sure you want to deactivate ${section.name}?`)) {
      await deleteSection(section._id);
    }
  };

  const handleSubmit = async (data: CreateSectionRequest | UpdateSectionRequest) => {
    if (mode === "create") {
      return await createSection(data as CreateSectionRequest);
    } else if (selectedSection) {
      return await updateSection(selectedSection._id, data as UpdateSectionRequest);
    }
    return false;
  };

  const getGradeName = (gradeId: string | { name: string; level: number } | undefined) => {
    if (!gradeId) return "All Grades";
    if (typeof gradeId === "object") return `${gradeId.name} (Level ${gradeId.level})`;
    const grade = grades.find((g) => g._id === gradeId);
    return grade ? `${grade.name} (Level ${grade.level})` : "All Grades";
  };

  if (loading && sections.length === 0) {
    return <div className="p-8">Loading sections...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sections</h1>
          <p className="text-muted-foreground">Manage class sections</p>
        </div>
        <Button onClick={handleCreate}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Section
        </Button>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-muted-foreground mb-4">No sections yet</p>
            <Button onClick={handleCreate} variant="outline">
              <IconPlus className="mr-2 h-4 w-4" />
              Create your first section
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <Card key={section._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{section.name}</CardTitle>
                    <CardDescription className="space-y-1 mt-2">
                      <div>
                        <Badge variant="outline">
                          {getGradeName(section.grade_id)}
                        </Badge>
                      </div>
                      {section.capacity! > 0 && (
                        <div className="flex items-center gap-1 text-xs">
                          <IconUsers className="h-3 w-3" />
                          Capacity: {section.capacity}
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(section)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(section)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">ID:</span> {section.section_id}
                  </div>
                  {section.description && (
                    <div className="text-sm text-muted-foreground">
                      {section.description}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SectionFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleSubmit}
        section={selectedSection}
        grades={grades}
        mode={mode}
      />
    </div>
  );
}
