"use client"

import * as React from "react"
import { Link } from "@tanstack/react-router"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface NavSecondaryItem {
  title: string
  url: string
  icon: Icon
}

interface NavSecondaryProps extends React.ComponentPropsWithoutRef<typeof SidebarGroup> {
  items: NavSecondaryItem[]
}

export const NavSecondary = React.memo(function NavSecondary({
  items,
  ...props
}: NavSecondaryProps) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link 
                  to={item.url}
                  activeProps={{
                    className: "bg-sidebar-accent text-sidebar-accent-foreground"
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
})
