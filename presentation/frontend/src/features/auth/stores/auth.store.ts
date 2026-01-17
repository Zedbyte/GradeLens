// features/auth/stores/auth.store.ts
import { create } from "zustand";
import { loginApi, refreshApi, logoutApi } from "../api/auth.api";
import type { AuthUser } from "../types/auth.types";

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,

  async login(email, password) {
    const res = await loginApi({ email, password });
    set({
      user: res.user,
      accessToken: res.accessToken,
      isAuthenticated: true,
    });
  },

  async logout() {
    await logoutApi();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  async hydrate() {
    try {
      const res = await refreshApi();
      set({
        user: res.user,
        accessToken: res.accessToken,
        isAuthenticated: true,
      });
    } catch {
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },
}));
