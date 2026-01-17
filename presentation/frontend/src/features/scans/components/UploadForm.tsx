import { useState } from "react"
import { uploadScanApi } from "../api/scans.api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function UploadForm({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!file) return

    setLoading(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1]
      await uploadScanApi({ image: base64 })
      setLoading(false)
      onUploaded()
    }
    reader.readAsDataURL(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Scan</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <Input
          type="file"
          onChange={e => setFile(e.target.files?.[0] || null)}
        />

        <Button
          onClick={handleSubmit}
          disabled={!file || loading}
          className="w-full"
        >
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </CardContent>
    </Card>
  )
}
