
import { createFileRoute } from '@tanstack/react-router'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DataTable } from '@/components/data-table'
import { SectionCards } from '@/components/section-cards'
import { NetworkScanner } from '@/components/NetworkScanner'
import { AlertsManager } from '@/components/alerts/AlertsManager'
import data from '@/app/dashboard/data.json'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  return (
    <div className="space-y-6">
      <SectionCards />
      
      {/* Alert Summary Section */}
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ChartAreaInteractive />
        </div>
        <div>
          <NetworkScanner />
        </div>
      </div>
      <DataTable data={data} />
    </div>
  )
}