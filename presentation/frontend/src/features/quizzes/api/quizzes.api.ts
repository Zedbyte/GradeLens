import { api } from "@/api/axios";
import type {
  Quiz,
  CreateQuizRequest,
  UpdateQuizRequest,
  QuizListResponse,
  QuizStatistics,
} from "../types/quizzes.types.ts";
import type { Scan } from "@/features/scans/types/scans.types.ts";

export const quizzesApi = {
  /**
   * Get all quizzes
   */
  async list(params?: {
    status?: string;
    class_id?: string;
    template_id?: string;
    page?: number;
    limit?: number;
  }): Promise<QuizListResponse> {
    const { data } = await api.get("/quizzes", { params });
    return data;
  },

  /**
   * Get quiz by ID
   */
  async getById(id: string): Promise<{ quiz: Quiz }> {
    const { data } = await api.get(`/quizzes/${id}`);
    return data;
  },

  /**
   * Create new quiz
   */
  async create(quiz: CreateQuizRequest): Promise<{ message: string; quiz: Quiz }> {
    const { data } = await api.post("/quizzes", quiz);
    return data;
  },

  /**
   * Update quiz
   */
  async update(
    id: string,
    updates: UpdateQuizRequest
  ): Promise<{ message: string; quiz: Quiz }> {
    const { data } = await api.put(`/quizzes/${id}`, updates);
    return data;
  },

  /**
   * Delete (archive) quiz
   */
  async delete(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/quizzes/${id}`);
    return data;
  },

  /**
   * Update quiz status
   */
  async updateStatus(
    id: string,
    status: "draft" | "active" | "completed" | "archived"
  ): Promise<{ message: string; quiz: Quiz }> {
    const { data } = await api.patch(`/quizzes/${id}/status`, { status });
    return data;
  },

  /**
   * Get quiz statistics
   */
  async getStatistics(id: string): Promise<QuizStatistics> {
    const { data } = await api.get(`/quizzes/${id}/statistics`);
    return data;
  },

  /**
   * Get scans for quiz
   */
  async getScans(
    id: string,
    params?: { status?: string; page?: number; limit?: number }
  ): Promise<{ scans: Scan[]; total: number; page: number; limit: number; pages: number }> {
    const { data } = await api.get(`/quizzes/${id}/scans`, { params });
    return data;
  },
};
