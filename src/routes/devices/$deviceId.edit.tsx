import { createFileRoute } from '@tanstack/react-router'
import { AddDeviceForm } from '@/components/devices/AddDeviceForm'

export const Route = createFileRoute('/devices/$deviceId/edit')({
  component: EditDevice,
})

function EditDevice() {
  const { deviceId } = Route.useParams()
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Edit Device</h1>
      </div>
      <AddDeviceForm deviceId={deviceId} />
    </div>
  )
} 