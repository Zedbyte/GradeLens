/* eslint-disable react-hooks/immutability */
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconCamera, IconUpload, IconEdit } from "@tabler/icons-react";
import { useGrades } from "@/features/grades/hooks/useGrades";
import { useSections } from "@/features/sections/hooks/useSections";
import { useClasses } from "@/features/classes/hooks/useClasses";
import { useQuizzes } from "@/features/quizzes/hooks/useQuizzes";
import { useStudents } from "@/features/students/hooks/useStudents";
import { fetchScansApi, fetchScanApi } from "../features/scans/api/scans.api";
import { UploadForm } from "../features/scans/components/UploadForm";
import { ScanFilters } from "../features/scans/components/ScanFilters";
import { AssessmentSelection } from "../features/scans/components/AssessmentSelection";
import { ScanQueue } from "../features/scans/components/ScanQueue";
import { ScanDetails } from "../features/scans/components/ScanDetails";
import type { Scan } from "@/features/scans/types/scans.types";

export function ScanPage() {
  // State for filters
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  
  // State for scan workflow
  const [selectedQuiz, setSelectedQuiz] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan>();
  const [activeTab, setActiveTab] = useState<string>("upload");

  // Load data
  const { grades, loadGrades } = useGrades();
  const { sections, loadSections } = useSections();
  const { classes, loadClasses } = useClasses();
  const { quizzes, loadQuizzes } = useQuizzes();
  const { students, loadStudents } = useStudents();

  useEffect(() => {
    loadGrades();
    loadSections();
    loadClasses();
    loadQuizzes();
    loadStudents();
    loadScans();
  }, [loadGrades, loadSections, loadClasses, loadQuizzes, loadStudents]);

  async function loadScans() {
    setScans(await fetchScansApi());
  }

  async function selectScan(id: string) {
    setSelectedScan(await fetchScanApi(id));
  }

  // Filter sections by selected grade
  const filteredSections = selectedGrade
    ? sections.filter(s => {
        if (typeof s.grade_id === "object" && s.grade_id?._id) {
          return s.grade_id._id === selectedGrade;
        }
        return s.grade_id === selectedGrade;
      })
    : sections;

  // Filter classes by selected grade/section
  const filteredClasses = classes.filter(c => {
    if (selectedGrade && c.grade_id !== selectedGrade) return false;
    if (selectedSection && c.section_id !== selectedSection) return false;
    return true;
  });

  // Filter students by selected grade/section/class
  const filteredStudents = students.filter(s => {
    if (selectedGrade && s.grade_id !== selectedGrade) return false;
    if (selectedSection && s.section_id !== selectedSection) return false;
    if (selectedClass && !s.class_ids?.includes(selectedClass)) return false;
    return true;
  });

  // console.log(selectedGrade, selectedSection, selectedClass);
  // console.log(students);

  
  
  
  

  // Find selected quiz details
  const quizDetails = quizzes.find(q => q._id === selectedQuiz);
  // const studentDetails = students.find(s => s._id === selectedStudent);
  const selectedScanDetails = selectedScan ? {
    quiz: quizzes.find(q => q._id === selectedScan.exam_id),
    student: students.find(s => s._id === selectedScan.student_id),
  } : undefined;

  const handleSaveScan = () => {
    console.log("Saving scan:", selectedScan);
    // TODO: Implement save functionality
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Title Section */}
      <div>
        <h1 className="text-3xl font-bold">Scan Management</h1>
        <p className="text-muted-foreground">Scan, upload, or manually enter student answer sheets</p>
      </div>

      {/* Filters Row */}
      <ScanFilters
        grades={grades}
        sections={sections}
        classes={classes}
        selectedGrade={selectedGrade}
        selectedSection={selectedSection}
        selectedClass={selectedClass}
        onGradeChange={(value) => {
          setSelectedGrade(value);
          setSelectedSection("");
          setSelectedClass("");
        }}
        onSectionChange={(value) => {
          setSelectedSection(value);
          setSelectedClass("");
        }}
        onClassChange={setSelectedClass}
        filteredSections={filteredSections}
        filteredClasses={filteredClasses}
      />

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_2fr_1fr]">
        {/* Left Column: Quiz Selection + Scan Queue */}
        <div className="space-y-6">
          {/* Assessment Selection */}
          <AssessmentSelection
            quizzes={quizzes}
            students={filteredStudents}
            selectedQuiz={selectedQuiz}
            selectedStudent={selectedStudent}
            onQuizChange={setSelectedQuiz}
            onStudentChange={setSelectedStudent}
            quizDetails={quizDetails}
          />

          {/* Scan Queue */}
          <ScanQueue
            scans={scans}
            selectedScanId={selectedScan?.scan_id}
            onSelect={selectScan}
            quizzes={quizzes}
            students={students}
          />
        </div>

        {/* Middle Column: Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Scan Input</CardTitle>
            <CardDescription>Choose your preferred input method</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="scanning" className="flex items-center gap-2">
                  <IconCamera className="h-4 w-4" />
                  Scanning
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <IconUpload className="h-4 w-4" />
                  Upload
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <IconEdit className="h-4 w-4" />
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="scanning" className="space-y-4 py-4">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 space-y-4">
                  <IconCamera className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center space-y-2">
                    <p className="font-medium">Live Scanner Preview</p>
                    <p className="text-sm text-muted-foreground">
                      Camera scanning feature coming soon
                    </p>
                  </div>
                  <Button disabled>
                    <IconCamera className="mr-2 h-4 w-4" />
                    Start Camera
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="py-4">
                <UploadForm onUploaded={loadScans} />
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 py-4">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 space-y-4">
                  <IconEdit className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center space-y-2">
                    <p className="font-medium">Manual Entry</p>
                    <p className="text-sm text-muted-foreground">
                      Manually enter student answers
                    </p>
                  </div>
                  <Button disabled={!selectedQuiz || !selectedStudent}>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Start Manual Entry
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Column: Scan Details */}
        <ScanDetails
          scan={selectedScan}
          quiz={selectedScanDetails?.quiz}
          student={selectedScanDetails?.student}
          onSave={handleSaveScan}
        />
      </div>
    </div>
  );
}
