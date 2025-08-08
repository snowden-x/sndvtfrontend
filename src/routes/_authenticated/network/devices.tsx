import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { 
  IconRefresh, 
  IconPlus, 
  IconWifi,
  IconWifiOff,
  IconRouter,
  IconServer,
  IconShield,
  IconDeviceDesktop,
  IconSearch,
  IconActivity,
  IconFilter
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { networkAgentService } from '@/services/network-agent'
import type { Device } from '@/services/network-agent'

export const Route = createFileRoute('/_authenticated/network/devices')({
  component: DevicesPage,
})

function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  // Using Sonner toast

  const filteredDevices = devices.filter(device => {
    const matchesText =
      device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      device.hostname?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === 'all' || (device.device_type?.toLowerCase() === typeFilter)
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'online' ? device.is_reachable === 'reachable' : device.is_reachable !== 'reachable')
    return matchesText && matchesType && matchesStatus
  })

  const reachableDevices = devices.filter(d => d.is_reachable === 'reachable')

  const loadDevices = async () => {
    setLoading(true)
    try {
      const response = await networkAgentService.getDevices()
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (response.data) {
        setDevices(response.data)
      }
    } catch (error) {
      toast.error("Failed to load devices")
    } finally {
      setLoading(false)
    }
  }

  const discoverDevices = async () => {
    setDiscovering(true)
    try {
      const response = await networkAgentService.discoverDevices()
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      toast.success("Device discovery completed")
      
      // Reload devices
      await loadDevices()
    } catch (error) {
      toast.error("Failed to discover devices")
    } finally {
      setDiscovering(false)
    }
  }

  const testConnectivity = async () => {
    try {
      const response = await networkAgentService.testConnectivity()
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      toast.success("Connectivity test completed")
      
      // Reload devices to get updated status
      await loadDevices()
    } catch (error) {
      toast.error("Failed to test connectivity")
    }
  }

  useEffect(() => {
    loadDevices()
  }, [])

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'router':
        return <IconRouter className="h-5 w-5" />
      case 'switch':
        return <IconServer className="h-5 w-5" />
      case 'firewall':
        return <IconShield className="h-5 w-5" />
      default:
        return <IconDeviceDesktop className="h-5 w-5" />
    }
  }

  const getStatusIcon = (isReachable: string) => {
    return isReachable === 'reachable' 
      ? <IconWifi className="h-4 w-4 text-green-500" />
      : <IconWifiOff className="h-4 w-4 text-red-500" />
  }

  const getStatusColor = (isReachable: string) => {
    return isReachable === 'reachable' ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Network Devices</h2>
          <p className="text-muted-foreground">
            {reachableDevices.length}/{devices.length} devices online
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={testConnectivity}
          >
            <IconActivity className="h-4 w-4 mr-2" />
            Test Connectivity
          </Button>
          
          <Button
            variant="outline"
            onClick={discoverDevices}
            disabled={discovering}
          >
            <IconPlus className="h-4 w-4 mr-2" />
            {discovering ? 'Discovering...' : 'Discover Devices'}
          </Button>
          
          <Button
            variant="outline"
            onClick={loadDevices}
            disabled={loading}
          >
            <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative max-w-md">
          <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <IconFilter className="h-4 w-4 text-muted-foreground" />
          <select className="border rounded-md px-2 py-1 text-sm bg-background" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="router">Router</option>
            <option value="switch">Switch</option>
            <option value="firewall">Firewall</option>
          </select>
          <select className="border rounded-md px-2 py-1 text-sm bg-background" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Any status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      {/* Devices Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <div className="h-5 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredDevices.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <IconDeviceDesktop className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No devices found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No devices match your search criteria.' : 'No devices have been discovered yet.'}
            </p>
            {!searchQuery && (
              <Button onClick={discoverDevices} disabled={discovering}>
                <IconPlus className="h-4 w-4 mr-2" />
                Discover Devices
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDevices.map((device) => (
            <Card key={device.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  {getDeviceIcon(device.device_type)}
                  <CardTitle className="text-base">{device.device_name}</CardTitle>
                </div>
                {getStatusIcon(device.is_reachable)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">IP Address</span>
                    <span className="text-sm font-medium">
                      {device.ip_address || 'Unknown'}
                    </span>
                  </div>
                  
                  {device.device_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {device.device_type}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`text-sm font-medium capitalize ${getStatusColor(device.is_reachable)}`}>
                      {device.is_reachable}
                    </span>
                  </div>
                  
                  {device.os_type && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">OS</span>
                      <span className="text-sm font-medium uppercase">
                        {device.os_type}
                      </span>
                    </div>
                  )}
                  
                  {device.last_seen && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Seen</span>
                      <span className="text-sm">
                        {new Date(device.last_seen).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}