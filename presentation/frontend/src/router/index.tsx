import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import ClassesPage from "@/pages/ClassesPage";
import QuizzesPage from "@/pages/QuizzesPage";
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

            <Route
            path={ROUTES.STUDENTS}
            element={
                <ProtectedRoute>
                <AppLayout>
                    <StudentsPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />

            <Route
            path={ROUTES.CLASSES}
            element={
                <ProtectedRoute>
                <AppLayout>
                    <ClassesPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />

            <Route
            path={ROUTES.QUIZZES}
            element={
                <ProtectedRoute>
                <AppLayout>
                    <QuizzesPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />
        </Routes>
        </BrowserRouter>
    );
}