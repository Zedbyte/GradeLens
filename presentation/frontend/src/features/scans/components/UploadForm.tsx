import { useState } from "react"
import { uploadScanApi } from "../api/scans.api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert } from "@/components/ui/alert"
import { IconAlertCircle } from "@tabler/icons-react"

interface UploadFormProps {
  onUploaded: (scanId: string) => void;
  selectedQuiz?: string;
  selectedStudent?: string;
}

export function UploadForm({ onUploaded, selectedQuiz, selectedStudent }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!file || !selectedQuiz || !selectedStudent) return

    setLoading(true)

    try {
      const reader = new FileReader()
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1]
        const response = await uploadScanApi({
          image: base64,
          exam_id: selectedQuiz,
          student_id: selectedStudent
        })
        setFile(null)
        setLoading(false)
        onUploaded(response.scan_id)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      setLoading(false)
      console.error("Upload failed:", error)
    }
  }

  const canUpload = file && selectedQuiz && selectedStudent && !loading

  return (
    <div className="space-y-4">
      {(!selectedQuiz || !selectedStudent) && (
        <Alert>
          <IconAlertCircle className="h-4 w-4" />
          <div className="ml-2">
            <p className="text-sm font-medium">Selection Required</p>
            <p className="text-sm text-muted-foreground">
              Please select a quiz and student before uploading
            </p>
          </div>
        </Alert>
      )}

      <div className="space-y-3 rounded-lg border p-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Answer Sheet Image</label>
          <Input
            type="file"
            accept="image/*"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canUpload}
          className="w-full"
        >
          {loading ? "Uploading..." : "Upload and Process"}
        </Button>
      </div>
    </div>
  )
}
