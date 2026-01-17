import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import { ProtectedRoute } from "./guards/ProtectedRoute";
import { PublicRoute } from "./guards/PublicRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ROUTES } from "@/lib/constants";
import { ScanPage } from "@/pages/ScanPage";

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
                <AppLayout>
                    <DashboardPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />

            <Route
            path={ROUTES.SCAN}
            element={
                <ProtectedRoute>
                <AppLayout>
                    <ScanPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />
        </Routes>
        </BrowserRouter>
    );
}