"use client"

import * as React from "react"
import {
  IconDashboard,
  IconCamera,
  // IconHelp,
  // IconSearch,
  // IconSettings,
  IconWallpaper,
  IconFileAnalytics,
  IconUser,
  IconCategoryPlus,
  IconSchool,
  IconCategory,
  IconPhotoSensor,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main.tsx"
// import { NavDocuments } from "@/components/nav-documents.tsx"
// import { NavSecondary } from "@/components/nav-secondary.tsx"
import { NavUser } from "@/components/nav-user.tsx"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { ROUTES } from "@/lib/constants"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: ROUTES.DASHBOARD,
    icon: IconDashboard,
    roles: ["teacher", "admin"], // Available to both
  },
  {
    title: "Scans", //Page to scan/upload student answer sheets
    url: ROUTES.SCAN,
    icon: IconCamera,
    roles: ["teacher", "admin"],
  },
  {
    title: "Exams", //Page where we can create exams and assign them to classes, and answer keys
    url: ROUTES.EXAMS,
    icon: IconWallpaper,
    roles: ["teacher", "admin"],
  },
  {
    title: "Students", //Create accounts, and students.
    url: ROUTES.STUDENTS,
    icon: IconUser,
    roles: ["teacher", "admin"], // Both can view
  },
  {
    title: "Classes", //Create classes and assign students to classes
    url: ROUTES.CLASSES,
    icon: IconCategoryPlus,
    roles: ["admin"], // Admin only
  },
  {
    title: "Grades", //Manage grade levels
    url: ROUTES.GRADES,
    icon: IconSchool,
    roles: ["admin"], // Admin only
  },
  {
    title: "Sections", //Manage sections
    url: ROUTES.SECTIONS,
    icon: IconCategory,
    roles: ["admin"], // Admin only
  },
  {
    title: "Analytics", //This includes per student summary, mean-pl etc.
    url: ROUTES.REPORTS,
    icon: IconFileAnalytics,
    roles: ["teacher", "admin"],
  },
  {
    title: "Accounts", //Create accounts, and students.
    url: ROUTES.ACCOUNTS,
    icon: IconUser,
    roles: ["admin"], // Admin only
  },
]

// const navSecondary = [
//   {
//     title: "Settings",
//     url: "#",
//     icon: IconSettings,
//   },
//   {
//     title: "Get Help",
//     url: "#",
//     icon: IconHelp,
//   },
//   {
//     title: "Search",
//     url: "#",
//     icon: IconSearch,
//   },
// ]

// const documents = [
//   {
//     name: "Data Library",
//     url: "#",
//     icon: IconDatabase,
//   },
//   {
//     name: "Reports",
//     url: "#",
//     icon: IconReport,
//   },
// ]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()

  // Filter navigation items based on user role
  const filteredNavMain = React.useMemo(() => {
    if (!user) return [];
    return navMain.filter(item => item.roles.includes(user.role));
  }, [user]);

  return (
    <Sidebar collapsible="offcanvas" {...props} className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="border-b border-sidebar-border p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="hover:bg-transparent active:bg-transparent p-0 h-auto items-start"
            >
              <a href={ROUTES.DASHBOARD} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <IconPhotoSensor className="size-6 text-sidebar-primary shrink-0" style={{ width: '24px', height: '24px' }} />
                  <span className="text-2xl font-bold text-sidebar-primary">GradeLens</span>
                </div>
                {/* <p className="text-sm text-sidebar-foreground/60">Assessment Web-Platform</p> */}
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={filteredNavMain} />
        {/* <NavDocuments items={documents} /> */}
        {/* <NavSecondary items={navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{
          name: user?.email.split('@')[0] || "User",
          email: user?.email || "",
          avatar: "",
        }} />
      </SidebarFooter>
    </Sidebar>
  )
}