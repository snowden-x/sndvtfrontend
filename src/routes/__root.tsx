import React from 'react'
import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import {
  SidebarInset,
  SidebarProvider,
} from '@/components/ui/sidebar'
import { AuthProvider } from '@/contexts/AuthContext'

// Memoize the main content area
const MainContent = React.memo(function MainContent() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 px-6 py-4 md:gap-6 md:py-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
})

// Memoize the sidebar layout
const SidebarLayout = React.memo(function SidebarLayout() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <MainContent />
      </SidebarInset>
    </SidebarProvider>
  )
})

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <RootContent />
      {import.meta.env.MODE === 'development' && <TanStackRouterDevtools />}
    </AuthProvider>
  ),
}) 

function RootContent() {
  const location = useLocation()
  const isAuthScreen = location.pathname.startsWith('/login')

  if (isAuthScreen) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex min-h-screen items-center justify-center">
          <Outlet />
        </div>
      </div>
    )
  }

  return <SidebarLayout />
}