"use client"

import * as React from "react"
import {
  IconDashboard,
  IconCamera,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
  IconWallpaper,
  IconFileAnalytics,
  IconUser,
  IconCategoryPlus,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main.tsx"
// import { NavDocuments } from "@/components/nav-documents.tsx"
import { NavSecondary } from "@/components/nav-secondary.tsx"
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
  },
  {
    title: "Scans", //Page to scan/upload student answer sheets
    url: ROUTES.SCAN,
    icon: IconCamera,
  },
  {
    title: "Quizzes", //Page where we can create quizzes and assign them to classes, and answer keys
    url: '#',
    icon: IconWallpaper,
  },
  {
    title: "Report (Summary)", //This includes per student summary, mean-pl etc.
    url: '#',
    icon: IconFileAnalytics,
  },
  {
    title: "Accounts", //Create accounts, and students.
    url: '#',
    icon: IconUser,
  },
  {
    title: "Classes", //Create classes and assign students to classes
    url: '#',
    icon: IconCategoryPlus,
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "#",
    icon: IconSettings,
  },
  {
    title: "Get Help",
    url: "#",
    icon: IconHelp,
  },
  {
    title: "Search",
    url: "#",
    icon: IconSearch,
  },
]

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

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href={ROUTES.DASHBOARD}>
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">GradeLens</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        {/* <NavDocuments items={documents} /> */}
        <NavSecondary items={navSecondary} className="mt-auto" />
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