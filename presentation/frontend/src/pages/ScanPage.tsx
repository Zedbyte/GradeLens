import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconCamera, IconUpload, IconEdit } from "@tabler/icons-react";
import { useGrades } from "@/features/grades/hooks/useGrades";
import { useSections } from "@/features/sections/hooks/useSections";
import { useClasses } from "@/features/classes/hooks/useClasses";
import { useExams } from "@/features/exams/hooks/useExams";
import { useStudents } from "@/features/students/hooks/useStudents";
import { useTemplate } from "@/hooks/useTemplate";
import { useScans } from "../features/scans/hooks/useScans";
import { UploadForm } from "../features/scans/components/UploadForm";
import { LiveScanner } from "../features/scans/components/LiveScanner";
import { ScanFilters } from "../features/scans/components/ScanFilters";
import { AssessmentSelection } from "../features/scans/components/AssessmentSelection";
import { ScanQueue } from "../features/scans/components/ScanQueue";
import { ScanDetails } from "../features/scans/components/ScanDetails";
import type { Class } from "@/features/classes";
import { extractId } from "@/lib/extractId";

export function ScanPage() {
  // State for filters
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  
  // State for scan workflow
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("upload");

  // Use Zustand store for scans
  const { 
    scans, 
    selectedScan, 
    selectedScanId,
    loadScans, 
    selectScan,
    uploadScan 
  } = useScans();

  // Load data
  const { grades, loadGrades } = useGrades();
  const { sections, loadSections } = useSections();
  const { classes, loadClasses } = useClasses();
  const { exams, loadExams } = useExams();
  const { students, loadStudents } = useStudents();

  // Load template based on selected exam
  const selectedExamDetails = exams.find(q => q._id === selectedExam);
  const { template } = useTemplate(selectedExamDetails?.template_id);

  // Load initial data once on mount
  // Using useRef to ensure functions are called only once and avoid dependency issues
  const initialLoadRef = useRef(false);
  
  useEffect(() => {
    // Prevent double execution in React StrictMode during development
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    // Load all initial data
    const loadInitialData = async () => {
      await Promise.all([
        loadGrades(),
        loadSections(),
        loadClasses(),
        loadExams(),
        loadStudents(),
        loadScans(),
      ]);
    };

    loadInitialData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - load once on mount

  // Filter sections by selected grade
  const filteredSections = selectedGrade
      ? sections.filter(s => extractId(s.grade_id) === selectedGrade)
      : sections;

  // Filter classes by selected grade/section
  const filteredClasses = classes.filter(c => {
    if (selectedGrade && c.grade_id !== selectedGrade) return false;
    if (selectedSection) {
      // Class may belong to multiple sections (section_ids array)
      // support both new `section_ids` and possible legacy `section_id` fields
      const sectionIds: string[]  = Array.isArray((c as Class).section_ids)
        ? ((c as Class).section_ids as string[])
        : [];

      if (sectionIds.length > 0) {
        if (!sectionIds.includes(selectedSection)) return false;
      } else {
        // no section info on class, exclude when a section is selected
        return false;
      }
    }
    return true;
  });

  // Find selected exam details
  const examDetails = exams.find(q => q._id === selectedExam);

  // Filter students by selected grade/section/class and exam's class
  const filteredStudents = students.filter(s => {
    if (selectedGrade && s.grade_id !== selectedGrade) return false;
    if (selectedSection && s.section_id !== selectedSection) return false;
    if (selectedClass && !s.class_ids?.includes(selectedClass)) return false;
    
    // If exam is selected, only show students from that exam's class
    if (selectedExam && examDetails?.class_id) {
      const examClassId = typeof examDetails.class_id === 'string' 
        ? examDetails.class_id 
        : extractId(examDetails.class_id);
      if (examClassId && !s.class_ids?.includes(examClassId)) return false;
    }
    
    return true;
  });

  const handleSaveScan = async () => {
    // Refresh scans - the store will handle refreshing selected scan automatically
    await loadScans();
  };

  const handleRedoScan = () => {
    if (!selectedScan) return;
    
    // Pre-fill the exam and student from the current scan
    const exam = exams.find(q => q._id === selectedScan.exam_id);
    const student = students.find(s => s._id === selectedScan.student_id);
    
    if (exam && student) {
      setSelectedExam(exam._id!);
      setSelectedStudent(student._id!);
      // Switch to upload tab for re-scanning
      setActiveTab("upload");
    }
  };

  const handleLiveCapture = async (imageData: string) => {
    if (!selectedExam || !selectedStudent) return;

    try {
      const scanId = await uploadScan({
        image: imageData,
        exam_id: selectedExam,
        student_id: selectedStudent,
      });

      // Select the newly uploaded scan (will trigger polling)
      selectScan(scanId);
      
      // Switch to upload tab to show the queue
      setActiveTab("upload");
    } catch (error) {
      console.error("Failed to upload scan:", error);
    }
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

      {/* Assessment Selection Row */}
      <AssessmentSelection
        exams={exams}
        students={filteredStudents}
        selectedExam={selectedExam}
        selectedStudent={selectedStudent}
        onExamChange={setSelectedExam}
        onStudentChange={setSelectedStudent}
        examDetails={examDetails}
      />

      {/* Scan Input Row */}
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
              <LiveScanner
                selectedExam={selectedExam}
                selectedStudent={selectedStudent}
                template={template || undefined}
                onCapture={handleLiveCapture}
              />
            </TabsContent>

            <TabsContent value="upload" className="py-4">
              <UploadForm 
                onUploaded={(scanId) => {
                  loadScans();
                  selectScan(scanId);
                }}
                selectedExam={selectedExam}
                selectedStudent={selectedStudent}
              />
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
                <Button disabled={!selectedExam || !selectedStudent}>
                  <IconEdit className="mr-2 h-4 w-4" />
                  Start Manual Entry
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Scan Queue and Details Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Scan Queue - Smaller Column */}
        <div className="lg:col-span-4">
          <ScanQueue
            scans={scans}
            selectedScanId={selectedScanId || undefined}
            onSelect={selectScan}
            exams={exams}
            students={students}
          />
        </div>

        {/* Scan Details - Larger Column */}
        <div className="lg:col-span-8">
          <ScanDetails
            onSave={handleSaveScan}
            onRedoScan={handleRedoScan}
            exams={exams}
            students={students}
          />
        </div>
      </div>
    </div>
  );
}
