import * as React from "react"
import { Link } from "@tanstack/react-router"
import {
  IconChartBar,
  IconDashboard,
  IconDeviceDesktop,
  IconHelp,
  IconInnerShadowTop,
  IconMessageCircle,
  IconPlus,
  IconSearch,
  IconSettings,
  IconWifi,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Move data outside component to prevent recreation on every render
const sidebarData = {
  user: {
    name: "Network Admin",
    email: "admin@company.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: IconDashboard,
    },
    {
      title: "Chat",
      url: "/chat",
      icon: IconMessageCircle,
    },
    {
      title: "Devices",
      url: "/devices",
      icon: IconDeviceDesktop,
      items: [
        {
          title: "All Devices",
          url: "/devices",
        },
        {
          title: "Add Device",
          url: "/devices/new",
        },
      ],
    },
    {
      title: "Network Discovery",
      url: "/discovery",
      icon: IconWifi,
    },
    {
      title: "Analytics",
      url: "/analytics",
      icon: IconChartBar,
    },
  ],

  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "Help & Support",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],

  quickActions: [
    {
      name: "Add Device",
      url: "/devices/new",
      icon: IconPlus,
    },
    {
      name: "Network Scan",
      url: "/discovery/scan",
      icon: IconWifi,
    },
  ],
} as const

export const AppSidebar = React.memo(function AppSidebar({ 
  ...props 
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link to="/">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">SNDVT Monitor</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarData.navMain} />
        <NavDocuments items={sidebarData.quickActions} />
        <NavSecondary items={sidebarData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
    </Sidebar>
  )
})
