import { useEffect, useState } from "react";
import { fetchScans, fetchScan } from "../api/scans";
import { UploadForm } from "../components/UploadForm";
import { ScanList } from "../components/ScanList";
import { ScanDetail } from "../components/ScanDetail";

export function Home() {
    const [scans, setScans] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);

    async function loadScans() {
        setScans(await fetchScans());
    }

    async function selectScan(id: string) {
        setSelected(await fetchScan(id));
    }

    useEffect(() => {
        loadScans();
    }, []);

    return (
        <div style={{ display: "flex", gap: 20 }}>
        <div>
            <UploadForm onUploaded={loadScans} />
            <ScanList scans={scans} onSelect={selectScan} />
        </div>
        <ScanDetail scan={selected} />
        </div>
    );
}
