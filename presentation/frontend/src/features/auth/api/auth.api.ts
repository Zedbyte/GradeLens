import { api } from "@/api/axios";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export const loginApi = async (
  payload: LoginRequest
): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>(
    "/auth/login",
    payload
  );
  return data;
};

export const refreshApi = async (): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>("/auth/refresh");
  return data;
};

export const logoutApi = async (): Promise<void> => {
  await api.post("/auth/logout");
};
