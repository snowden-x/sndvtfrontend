import { createFileRoute } from '@tanstack/react-router'
import { DeviceDetail } from '@/components/devices/DeviceDetail'

export const Route = createFileRoute('/devices/$deviceId')({
  component: DeviceDetailPage,
})

function DeviceDetailPage() {
  const { deviceId } = Route.useParams()
  
  return (
    <div className="space-y-6">
      <DeviceDetail deviceId={deviceId} />
    </div>
  )
} 