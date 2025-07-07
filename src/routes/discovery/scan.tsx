import { createFileRoute } from '@tanstack/react-router'
import { NetworkScanner } from '@/components/discovery/NetworkScanner'

export const Route = createFileRoute('/discovery/scan')({
  component: DiscoveryScanPage,
})

function DiscoveryScanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Scanner</h1>
          <p className="text-muted-foreground">
            Start a new network discovery scan to find devices
          </p>
        </div>
      </div>
      <NetworkScanner />
    </div>
  )
} 