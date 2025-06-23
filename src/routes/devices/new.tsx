import { createFileRoute } from '@tanstack/react-router'
import { AddDeviceForm } from '@/components/devices/AddDeviceForm'

export const Route = createFileRoute('/devices/new')({
  component: AddDevicePage,
})

function AddDevicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Device</h1>
          <p className="text-muted-foreground">
            Configure a new network device for monitoring
          </p>
        </div>
      </div>
      <AddDeviceForm />
    </div>
  )
} 