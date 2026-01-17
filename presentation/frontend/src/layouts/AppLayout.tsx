import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import type { ReactNode } from "react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
    return (
        <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 w-full">
            <div className="border-b">
            <div className="flex h-14 items-center px-4">
                <SidebarTrigger />
                <div className="ml-auto flex items-center space-x-4">
                    GradeLens
                </div>
            </div>
            </div>
            <div className="flex-1">
            {children}
            </div>
        </main>
        </SidebarProvider>
    );
}