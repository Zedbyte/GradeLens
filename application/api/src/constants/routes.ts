export const API_ROUTES = {
    BASE: {
        API: "/api",
    },
    AUTH: {
        LOGIN: "/auth/login",
        REFRESH: "/auth/refresh",
        REFRESH_PATH: "/api/auth/refresh",
        LOGOUT: "/auth/logout",
        ME: "/auth/me",
    },
    SCANS: {
        BASE: "/scans",
        BY_ID: (scanId: string) => `/scans/${scanId}`,
    },
    HEALTH: "/",
} as const;