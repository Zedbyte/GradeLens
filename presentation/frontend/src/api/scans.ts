const API_BASE = "http://localhost:3000/api";

export async function uploadScan(base64Image: string) {
  const res = await fetch(`${API_BASE}/scans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: base64Image })
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function fetchScans() {
  const res = await fetch(`${API_BASE}/scans`);
  return res.json();
}

export async function fetchScan(scan_id: string) {
  const res = await fetch(`${API_BASE}/scans/${scan_id}`);
  return res.json();
}
