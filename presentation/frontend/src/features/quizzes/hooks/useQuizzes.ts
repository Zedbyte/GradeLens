import { useState, useCallback } from "react";
import { quizzesApi } from "../api/quizzes.api";
import type { Quiz, CreateQuizRequest, UpdateQuizRequest, QuizStatistics } from "../types/quizzes.types";
import { getErrorMessage } from "@/lib/error";

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [statistics, setStatistics] = useState<QuizStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const loadQuizzes = useCallback(async (params?: {
    status?: string;
    class_id?: string;
    template_id?: string;
    page?: number;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.list(params);
      setQuizzes(data.quizzes);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to load quizzes");
      console.error("Failed to load quizzes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadQuiz = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.getById(id);
      setSelectedQuiz(data.quiz);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to load quiz");
      console.error("Failed to load quiz:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuiz = useCallback(async (quiz: CreateQuizRequest) => {
    setLoading(true);
    setError(null);
    try {
      await quizzesApi.create(quiz);
      await loadQuizzes();
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to create quiz");
      console.error("Failed to create quiz:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadQuizzes]);

  const updateQuiz = useCallback(async (id: string, updates: UpdateQuizRequest) => {
    setLoading(true);
    setError(null);
    try {
      await quizzesApi.update(id, updates);
      await loadQuizzes();
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to update quiz");
      console.error("Failed to update quiz:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadQuizzes]);

  const deleteQuiz = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await quizzesApi.delete(id);
      await loadQuizzes();
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to delete quiz");
      console.error("Failed to delete quiz:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadQuizzes]);

  const updateStatus = useCallback(async (
    id: string,
    status: "draft" | "active" | "completed" | "archived"
  ) => {
    setLoading(true);
    setError(null);
    try {
      await quizzesApi.updateStatus(id, status);
      await loadQuizzes();
      return true;
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to update status");
      console.error("Failed to update status:", err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [loadQuizzes]);

  const loadStatistics = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizzesApi.getStatistics(id);
      setStatistics(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || "Failed to load statistics");
      console.error("Failed to load statistics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    quizzes,
    selectedQuiz,
    statistics,
    loading,
    error,
    total,
    loadQuizzes,
    loadQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    updateStatus,
    loadStatistics,
  };
}
