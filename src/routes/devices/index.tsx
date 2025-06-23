import { createFileRoute } from '@tanstack/react-router'
import { DeviceList } from '@/components/devices/DeviceList'

export const Route = createFileRoute('/devices/')({
  component: DevicesPage,
})

function DevicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Network Devices</h1>
          <p className="text-muted-foreground">
            Manage and monitor your network devices
          </p>
        </div>
      </div>
      <DeviceList />
    </div>
  )
} 