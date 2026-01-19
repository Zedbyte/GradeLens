export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/",
  SCAN: "/scans",
  STUDENTS: "/students",
  CLASSES: "/classes",
  QUIZZES: "/quizzes",
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