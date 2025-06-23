import React from "react"
import { useLocation } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Helper function to get page title from pathname
function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Dashboard'
  if (pathname === '/devices') return 'Devices'
  if (pathname === '/devices/new') return 'Add Device'
  if (pathname.startsWith('/devices/') && pathname.endsWith('/edit')) return 'Edit Device'
  if (pathname.startsWith('/devices/')) return 'Device Details'
  if (pathname === '/discovery') return 'Network Discovery'
  if (pathname === '/analytics') return 'Analytics'
  if (pathname === '/settings') return 'Settings'
  if (pathname === '/help') return 'Help & Support'
  if (pathname === '/search') return 'Search'
  
  // Fallback: capitalize first letter of the path segment
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 1]?.charAt(0).toUpperCase() + segments[segments.length - 1]?.slice(1) || 'SNDVT Monitor'
}

export const SiteHeader = React.memo(function SiteHeader() {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>

      </div>
    </header>
  )
})
