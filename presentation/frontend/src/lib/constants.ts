export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
} as const;

export const QUERY_KEYS = {
  AUTH_ME: "auth_me",
} as const;

export const AUTH_API_ROUTES = {
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  ME: "/auth/me",
} as const;