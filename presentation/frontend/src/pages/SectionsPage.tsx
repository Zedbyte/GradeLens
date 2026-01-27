import { useEffect, useState } from "react";
import { useSections } from "../features/sections/hooks/useSections";
import { useGrades } from "../features/grades/hooks/useGrades";
import { SectionFormDialog } from "../features/sections/components/SectionFormDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";
import type { CreateSectionRequest, Section, UpdateSectionRequest } from "../features/sections/types/sections.types";
import DataTable from "@/components/data-table";
import getSectionColumns from "@/features/sections/columns/sections.columns";

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
        <DataTable columns={getSectionColumns({ onEdit: handleEdit, onDelete: handleDelete, grades })} data={sections} searchColumn="name" />
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
