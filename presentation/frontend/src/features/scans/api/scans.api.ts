import { api } from "@/api/axios";
import type { Scan, UploadScanRequest, UploadScanResponse } from "../types/scans.types";

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