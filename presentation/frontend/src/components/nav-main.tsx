"use client"

import { type Icon } from "@tabler/icons-react"
import { Link, useLocation } from "react-router-dom"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function NavMain({
    items,
}: {
    items: {
        title: string
        url: string
        icon?: Icon
    }[]
}) {
    const location = useLocation()
    
    return (
        <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
            {/* <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-sidebar-accent-foreground text-sidebar-primary-foreground hover:bg-sidebar-primary/90 hover:text-sidebar-primary-foreground active:bg-sidebar-primary/90 active:text-sidebar-primary-foreground min-w-8 duration-200 ease-linear px-4 py-3 h-auto"
                >
                <IconCirclePlusFilled className="size-5 shrink-0" style={{ width: '20px', height: '20px' }} />
                <span className="text-sm font-medium">Quick Scan</span>
                </SidebarMenuButton>
                <Button
                size="icon"
                className="size-10 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
                >
                <IconMail className="size-5 shrink-0" style={{ width: '20px', height: '20px' }} />
                <span className="sr-only">Inbox</span>
                </Button>
            </SidebarMenuItem>
            </SidebarMenu> */}
            <SidebarMenu className="space-y-2">
            {items.map((item) => {
                const isActive = location.pathname === item.url
                return (
                <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                    tooltip={item.title} 
                    asChild
                    className={cn(
                        "px-4 py-3 h-auto transition-colors",
                        isActive 
                            ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground" 
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                >
                    <Link to={item.url} className="flex items-center gap-3">
                    {item.icon && <item.icon className="size-5 shrink-0" style={{ width: '20px', height: '20px' }} />}
                    <span className="text-base font-medium">{item.title}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            )})}
            </SidebarMenu>
        </SidebarGroupContent>
        </SidebarGroup>
    )
}