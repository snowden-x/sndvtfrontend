import { createFileRoute } from '@tanstack/react-router'
import { AlertsManager } from '@/components/alerts/AlertsManager'

export const Route = createFileRoute('/_authenticated/alerts/')({
  component: AlertsPage,
})

function AlertsPage() {
  return (
    <AlertsManager 
      showTabs={true}
      defaultTab="alerts"
    />
  )
}