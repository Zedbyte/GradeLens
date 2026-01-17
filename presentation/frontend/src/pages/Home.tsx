import { useEffect, useState } from "react"
import { fetchScansApi, fetchScanApi } from "../features/scans/api/scans.api"
import { UploadForm } from "../features/scans/components/UploadForm"
import { ScanList } from "../features/scans/components/ScanList"
import { ScanDetail } from "../features/scans/components/ScanDetail"

export function Home() {
    const [scans, setScans] = useState<any[]>([])
    const [selected, setSelected] = useState<any>(null)

    async function loadScans() {
        setScans(await fetchScansApi())
    }

    async function selectScan(id: string) {
        setSelected(await fetchScanApi(id))
    }

    useEffect(() => {
        loadScans()
    }, [])

  return (
    <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[320px_1fr]">
      <div className="space-y-6">
        <UploadForm onUploaded={loadScans} />
        <ScanList scans={scans} onSelect={selectScan} />
      </div>

      <ScanDetail scan={selected} />
    </div>
  )
}
