import { useState, useEffect } from "react";
import { uploadScanApi, fetchScansApi, fetchScanApi } from "../api/scans.api";
import type { Scan } from "../types/scans.types";

export function useScans() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(false);

  const loadScans = async () => {
    setLoading(true);
    try {
      const data = await fetchScansApi();
      setScans(data);
    } catch (error) {
      console.error("Failed to load scans:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadScan = async (scanId: string) => {
    try {
      const data = await fetchScanApi(scanId);
      setSelectedScan(data);
    } catch (error) {
      console.error("Failed to load scan:", error);
    }
  };

  const uploadScan = async (base64Image: string) => {
    setLoading(true);
    try {
      await uploadScanApi({ image: base64Image });
      await loadScans();
    } catch (error) {
      console.error("Failed to upload scan:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScans();
  }, []);

  return {
    scans,
    selectedScan,
    loading,
    uploadScan,
    loadScans,
    selectScan: loadScan,
  };
}