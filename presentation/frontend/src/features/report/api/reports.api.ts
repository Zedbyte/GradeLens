// api/reports.api.ts
import { api } from "@/api/axios";
import type { 
  PLEntriesResponse, 
  PLEntriesQueryParams,
  ItemEntriesResponse,
  ItemEntriesQueryParams 
} from "../types/reports.types";

export const reportsApi = {
  /**
   * Fetch PL Entries for a specific grade, class, and exam
   */
  async getPLEntries(params: PLEntriesQueryParams): Promise<PLEntriesResponse> {
    const { data } = await api.get<PLEntriesResponse>("/reports/pl-entries", {
      params: {
        grade_id: params.grade_id,
        class_id: params.class_id,
        exam_id: params.exam_id,
      },
    });
    return data;
  },

  /**
   * Fetch Item Entries for a specific grade, class, and exam
   */
  async getItemEntries(params: ItemEntriesQueryParams): Promise<ItemEntriesResponse> {
    const { data } = await api.get<ItemEntriesResponse>("/reports/item-entries", {
      params: {
        grade_id: params.grade_id,
        class_id: params.class_id,
        exam_id: params.exam_id,
        view: params.view || "section",
      },
    });
    return data;
  },
};