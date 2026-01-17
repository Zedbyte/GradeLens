import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { ProtectedRoute } from "./guards/ProtectedRoute";
import { PublicRoute } from "./guards/PublicRoute";
import { ROUTES } from "@/lib/constants";

export function AppRouter() {
    return (
        <BrowserRouter>
        <Routes>
            <Route
            path={ROUTES.LOGIN}
            element={
                <PublicRoute>
                <LoginPage />
                </PublicRoute>
            }
            />

            <Route
            path={ROUTES.DASHBOARD}
            element={
                <ProtectedRoute>
                <DashboardPage />
                </ProtectedRoute>
            }
            />
        </Routes>
        </BrowserRouter>
    );
}
