export interface Scan {
  scan_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  confidence?: number;
  logs?: never;
  results?: never;
  createdAt?: string;
  updatedAt?: string;
}

export interface UploadScanRequest {
  image: string; // base64
}

export interface UploadScanResponse {
  scan_id: string;
  status: string;
}