import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { IconPlus, IconSearch, IconDeviceDesktop, IconWifi, IconServer, IconRouter } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

interface Device {
  id: string
  name: string
  host: string
  device_type: string
  enabled_protocols?: string[]
  description?: string
  timeout?: number
  retry_count?: number
  created_at?: string
  updated_at?: string
  // Runtime status (fetched separately)
  status?: 'online' | 'offline' | 'unknown'
  lastSeen?: string
}

const deviceTypeIcons = {
  router: IconRouter,
  switch: IconDeviceDesktop,
  firewall: IconServer,
  access_point: IconWifi,
  server: IconServer,
  generic: IconDeviceDesktop,
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-red-500',
  unknown: 'bg-gray-500',
}

export function DeviceList() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDevices()
  }, [])

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/devices/')
      if (!response.ok) {
        if (response.status === 0 || response.status >= 500) {
          throw new Error('Backend server is not running. Please start the API server at localhost:8000')
        }
        throw new Error(`Failed to fetch devices: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      setDevices(data)
      setError(null)
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to the backend server. Please make sure the API server is running on localhost:8000')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load devices')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.host.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.device_type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          {error.includes('Backend server') && (
            <div className="text-sm text-muted-foreground mb-4 p-4 bg-muted rounded-lg">
              <p className="font-medium mb-2">To start the backend server:</p>
              <code className="block text-xs bg-background p-2 rounded border">
                python api.py
              </code>
              <p className="mt-2">Server should be available at localhost:8000. See API_SETUP.md for details.</p>
            </div>
          )}
          <Button onClick={fetchDevices} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Button asChild>
            <Link to="/devices/new">
              <IconPlus className="h-4 w-4 mr-2" />
              Add Device
            </Link>
          </Button>
        </div>
      </div>

      {filteredDevices.length === 0 ? (
        <div className="text-center py-12">
          <IconDeviceDesktop className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No devices found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'No devices match your search criteria.' : 'Get started by adding your first device.'}
          </p>
          <Button asChild>
            <Link to="/devices/new">
              <IconPlus className="h-4 w-4 mr-2" />
              Add Device
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDevices.map((device) => {
            const IconComponent = deviceTypeIcons[device.device_type as keyof typeof deviceTypeIcons] || IconDeviceDesktop
            return (
              <Card key={device.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <Link to="/devices/$deviceId" params={{ deviceId: device.id }} className="block">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${statusColors[device.status || 'unknown']}`} />
                    </div>
                    <CardDescription>{device.host}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {device.device_type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {device.enabled_protocols?.join(', ') || 'No protocols'}
                        </span>
                      </div>
                      {device.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {device.description}
                        </p>
                      )}
                      {device.lastSeen && (
                        <p className="text-xs text-muted-foreground">
                          Last seen: {new Date(device.lastSeen).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
} 