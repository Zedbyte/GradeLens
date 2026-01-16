import { useState } from "react";
import { uploadScan } from "../api/scans";

export function UploadForm({ onUploaded }: { onUploaded: () => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit() {
        if (!file) return;

        setLoading(true);

        const reader = new FileReader();
        reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await uploadScan(base64);
        setLoading(false);
        onUploaded();
        };
        reader.readAsDataURL(file);
    }

    return (
        <div>
        <h3>Upload Scan</h3>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Uploading..." : "Upload"}
        </button>
        </div>
    );
}
