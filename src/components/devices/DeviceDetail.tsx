import { useState, useEffect } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { 
  IconArrowLeft, 
  IconEdit, 
  IconTrash, 
  IconNetwork, 
  IconDeviceDesktop,
  IconWifi,
  IconServer,
  IconRouter,
  IconCheck,
  IconX,
  IconLoader
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Device {
  id: string
  name: string
  host: string
  device_type: string
  enabled_protocols: string[]
  description?: string
  timeout: number
  retry_count: number
  created_at?: string
  updated_at?: string
  credentials?: {
    snmp_community?: string
    snmp_version?: string
    username?: string
    password?: string
    ssh_key?: string
    api_token?: string
    api_key?: string
  }
}

interface DeviceStatus {
  device_id: string
  reachable: boolean
  response_time?: number
  last_seen?: number
  error_message?: string
  uptime?: number
}

const deviceTypeIcons = {
  router: IconRouter,
  switch: IconDeviceDesktop,
  firewall: IconServer,
  access_point: IconWifi,
  server: IconServer,
  generic: IconDeviceDesktop,
}

interface DeviceDetailProps {
  deviceId: string
}

export function DeviceDetail({ deviceId }: DeviceDetailProps) {
  const router = useRouter()
  const [device, setDevice] = useState<Device | null>(null)
  const [status, setStatus] = useState<DeviceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pinging, setPinging] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchDevice()
    fetchDeviceStatus()
  }, [deviceId])

  const fetchDevice = async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Device not found')
        }
        if (response.status === 0 || response.status >= 500) {
          throw new Error('Backend server is not running. Please start the API server at localhost:8000')
        }
        throw new Error(`Failed to fetch device: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setDevice(data)
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to the backend server. Please make sure the API server is running on localhost:8000')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load device')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchDeviceStatus = async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/status`)
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (err) {
      console.error('Failed to fetch device status:', err)
    }
  }

  const handlePing = async () => {
    setPinging(true)
    try {
      const response = await fetch(`/api/devices/${deviceId}/ping`, {
        method: 'POST'
      })
      const result = await response.json()
      
      if (result.success) {
        setStatus(prev => prev ? { ...prev, reachable: true, response_time: result.response_time } : null)
      } else {
        setStatus(prev => prev ? { ...prev, reachable: false, error_message: result.error } : null)
      }
    } catch (err) {
      console.error('Ping failed:', err)
    } finally {
      setPinging(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        router.navigate({ to: '/devices' })
      } else {
        throw new Error('Failed to delete device')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete device')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button asChild variant="outline">
            <Link to="/devices">Back to Devices</Link>
          </Button>
        </div>
      </div>
    )
  }

  if (!device) {
    return null
  }

  const IconComponent = deviceTypeIcons[device.device_type as keyof typeof deviceTypeIcons] || IconDeviceDesktop

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm">
            <Link to="/devices">
              <IconArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <IconComponent className="h-8 w-8 text-muted-foreground" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{device.name}</h1>
              <p className="text-muted-foreground">{device.host}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handlePing} disabled={pinging} variant="outline">
            {pinging ? (
              <IconLoader className="h-4 w-4 animate-spin mr-2" />
            ) : (
                              <IconNetwork className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button asChild variant="outline">
            <Link to="/devices/$deviceId/edit" params={{ deviceId }}>
              <IconEdit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Device</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{device.name}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Status Alert */}
      {status && (
        <Alert className={status.reachable ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <div className="flex items-center gap-2">
            {status.reachable ? (
              <IconCheck className="h-4 w-4 text-green-600" />
            ) : (
              <IconX className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              {status.reachable ? (
                <>
                  Device is reachable
                  {status.response_time && ` (${status.response_time.toFixed(2)}ms)`}
                </>
              ) : (
                <>
                  Device is unreachable
                  {status.error_message && `: ${status.error_message}`}
                </>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* Device Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <p className="font-medium">{device.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Host</label>
                <p className="font-medium">{device.host}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <Badge variant="secondary">{device.device_type}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Protocols</label>
                <div className="flex flex-wrap gap-1">
                  {device.enabled_protocols.map((protocol) => (
                    <Badge key={protocol} variant="outline" className="text-xs">
                      {protocol}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            {device.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-sm">{device.description}</p>
              </div>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Timeout</label>
                <p className="font-medium">{device.timeout}s</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Retry Count</label>
                <p className="font-medium">{device.retry_count}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status & Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {status ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${status.reachable ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm">{status.reachable ? 'Online' : 'Offline'}</span>
                  </div>
                </div>
                {status.response_time && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm">{status.response_time.toFixed(2)}ms</span>
                  </div>
                )}
                {status.uptime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Uptime</span>
                    <span className="text-sm">{Math.floor(status.uptime / 3600)}h {Math.floor((status.uptime % 3600) / 60)}m</span>
                  </div>
                )}
                {status.last_seen && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Seen</span>
                    <span className="text-sm">{new Date(status.last_seen * 1000).toLocaleString()}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Status information not available</p>
            )}
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              {device.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(device.created_at).toLocaleDateString()}</p>
                </div>
              )}
              {device.updated_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Updated</label>
                  <p className="text-sm">{new Date(device.updated_at).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 