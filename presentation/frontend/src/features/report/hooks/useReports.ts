// features/report/hooks/useReports.ts
import { useState, useCallback } from "react";
import { reportsApi } from "@/features/report/api/reports.api";
import type { PLEntriesResponse } from "@/features/report/types/reports.types";
import { getErrorMessage } from "@/lib/error";

export interface UseReportsParams {
  grade_id: string;
  class_id: string;
  exam_id: string;
}

export function useReports() {
  const [plData, setPlData] = useState<PLEntriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPLEntries = useCallback(async (params: UseReportsParams) => {
    // Validate all params are present
    if (!params.grade_id || !params.class_id || !params.exam_id) {
      setError("Missing required parameters");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await reportsApi.getPLEntries({
        grade_id: params.grade_id,
        class_id: params.class_id,
        exam_id: params.exam_id,
      });
      setPlData(response);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to load PL Entries");
      console.error("Failed to load PL entries:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setPlData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    plData,
    loading,
    error,
    loadPLEntries,
    reset,
  };
}
