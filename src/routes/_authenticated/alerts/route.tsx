import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/alerts')({
  component: AlertsLayout,
})

function AlertsLayout() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and manage network downtime predictions and alerts
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}