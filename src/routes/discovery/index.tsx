import { createFileRoute } from '@tanstack/react-router'
import { DiscoveryDashboard } from '@/components/discovery/DiscoveryDashboard'

export const Route = createFileRoute('/discovery/')({
  component: DiscoveryPage,
})

function DiscoveryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Discovery</h1>
          <p className="text-muted-foreground">
            Discover and scan network devices across your infrastructure
          </p>
        </div>
      </div>
      <DiscoveryDashboard />
    </div>
  )
} 