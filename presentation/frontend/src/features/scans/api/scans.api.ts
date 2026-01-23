import { api } from "@/api/axios";
import type { 
  Scan, 
  UploadScanRequest, 
  UploadScanResponse,
  FramePreviewRequest,
  FramePreviewResponse
} from "../types/scans.types";

const CV_SERVICE_URL = import.meta.env.VITE_CV_SERVICE_URL || "http://localhost:8000";

export const uploadScanApi = async (
  payload: UploadScanRequest
): Promise<UploadScanResponse> => {
  const { data } = await api.post<UploadScanResponse>("/scans", payload);
  return data;
};

export const fetchScansApi = async (): Promise<Scan[]> => {
  const { data } = await api.get<Scan[]>("/scans");
  return data;
};

export const fetchScanApi = async (scanId: string): Promise<Scan> => {
  const { data } = await api.get<Scan>(`/scans/${scanId}`);
  return data;
};

export const previewFrameApi = async (
  payload: FramePreviewRequest
): Promise<FramePreviewResponse> => {
  const response = await fetch(`${CV_SERVICE_URL}/preview`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Preview failed: ${response.statusText}`);
  }

  return response.json();
};