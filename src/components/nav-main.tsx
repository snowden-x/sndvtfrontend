import React from "react"
import { Link, useLocation } from "@tanstack/react-router"
import { IconChevronRight, IconPlus, type Icon } from "@tabler/icons-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

interface NavItem {
  title: string
  url: string
  icon?: Icon
  items?: {
    title: string
    url: string
  }[]
}

interface NavMainProps {
  items: NavItem[]
}

export const NavMain = React.memo(function NavMain({ items }: NavMainProps) {
  const location = useLocation()
  
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              asChild
              tooltip="Add Device"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <Link to="/devices/new" className="flex items-center gap-2">
                <IconPlus />
                <span>Add Device</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {items.map((item) => (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={location.pathname.startsWith(item.url) && item.items?.length ? true : false}
            >
              <SidebarMenuItem>
                {item.items?.length ? (
                  // Item with sub-items - only show collapsible trigger
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton 
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        data-active={location.pathname.startsWith(item.url)}
                      >
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton asChild>
                              <Link 
                                to={subItem.url}
                                activeProps={{
                                  className: "bg-sidebar-accent text-sidebar-accent-foreground"
                                }}
                              >
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  // Item without sub-items - regular link
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link 
                      to={item.url}
                      activeProps={{
                        className: "bg-sidebar-accent text-sidebar-accent-foreground"
                      }}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
})
