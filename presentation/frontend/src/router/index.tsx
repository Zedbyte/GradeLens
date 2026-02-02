import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import StudentsPage from "@/pages/StudentsPage";
import ClassesPage from "@/pages/ClassesPage";
import ExamsPage from "@/pages/ExamsPage";
import { GradesPage } from "@/pages/GradesPage";
import { SectionsPage } from "@/pages/SectionsPage";
import ReportsPage from "@/pages/ReportsPage";
import { ProtectedRoute } from "./guards/ProtectedRoute";
import { PublicRoute } from "./guards/PublicRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ROUTES } from "@/lib/constants";
import { ScanPage } from "@/pages/ScanPage";
import AccountsPage from "@/pages/AccountsPage";

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
            path={ROUTES.EXAMS}
            element={
                <ProtectedRoute>
                <AppLayout>
                    <ExamsPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />

            <Route
            path={ROUTES.REPORTS}
            element={
                <ProtectedRoute>
                <AppLayout>
                    <ReportsPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />

            <Route
            path={ROUTES.GRADES}
            element={
                <ProtectedRoute>
                <AppLayout>
                    <GradesPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />

            <Route
            path={ROUTES.SECTIONS}
            element={
                <ProtectedRoute>
                <AppLayout>
                    <SectionsPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />

            <Route
            path={ROUTES.ACCOUNTS}
            element={
                <ProtectedRoute>
                <AppLayout>
                    <AccountsPage />
                </AppLayout>
                </ProtectedRoute>
            }
            />
        </Routes>
        </BrowserRouter>
    );
}