import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/network')({
  component: NetworkLayout,
})

function NetworkLayout() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Tools</h1>
          <p className="text-muted-foreground">
            AI-powered network troubleshooting and device management
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}