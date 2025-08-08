
import { createFileRoute } from '@tanstack/react-router'
import { SectionCards } from '@/components/section-cards'
import { AlertsManager } from '@/components/alerts/AlertsManager'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  return (
    <div className="space-y-6">
      <SectionCards />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Alerts</h2>
          <a 
            href="/alerts" 
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View all alerts →
          </a>
        </div>
        <AlertsManager 
          compact={true} 
          showTabs={false}
          className="border rounded-lg p-4"
        />
      </div>
    </div>
  )
}