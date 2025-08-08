import React from "react"
import { useLocation } from "@tanstack/react-router"

import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { UserProfile } from "@/components/auth/UserProfile"
import { useAuth } from "@/contexts/AuthContext"

// Helper function to get page title from pathname
function getPageTitle(pathname: string): string {
  if (pathname === '/dashboard' || pathname === '/') return 'Dashboard'
  
  // Fallback: capitalize first letter of the path segment
  const segments = pathname.split('/').filter(Boolean)
  return segments[segments.length - 1]?.charAt(0).toUpperCase() + segments[segments.length - 1]?.slice(1) || 'SNDVT Monitor'
}

export const SiteHeader = React.memo(function SiteHeader() {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)
  const { isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-40 flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-semibold tracking-tight">{pageTitle}</h1>
        
        {/* Spacer to push user profile to the right */}
        <div className="flex-1" />
        
        {/* User profile + theme toggle - only show if authenticated */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAuthenticated && <UserProfile />}
        </div>
      </div>
    </header>
  )
})
