import { useState } from 'react'
import { 
  IconDeviceDesktop, 
  IconChevronDown, 
  IconRefresh,
  IconSearch,
  IconWifi,
  IconWifiOff,
  IconRouter,
  IconServer,
  IconShield
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Device } from '@/services/network-agent'

interface DeviceSelectorProps {
  devices: Device[]
  selectedDevice: Device | null
  onDeviceSelect: (device: Device | null) => void
  onRefresh?: () => void
  className?: string
  compact?: boolean
}

const getDeviceIcon = (deviceType?: string) => {
  switch (deviceType?.toLowerCase()) {
    case 'router':
      return <IconRouter className="h-4 w-4" />
    case 'switch':
      return <IconServer className="h-4 w-4" />
    case 'firewall':
      return <IconShield className="h-4 w-4" />
    default:
      return <IconDeviceDesktop className="h-4 w-4" />
  }
}

const getStatusIcon = (isReachable: string) => {
  switch (isReachable.toLowerCase()) {
    case 'reachable':
      return <IconWifi className="h-3 w-3 text-green-500" />
    case 'unreachable':
      return <IconWifiOff className="h-3 w-3 text-red-500" />
    default:
      return <IconWifiOff className="h-3 w-3 text-gray-500" />
  }
}

const getStatusColor = (isReachable: string) => {
  switch (isReachable.toLowerCase()) {
    case 'reachable':
      return 'text-green-600'
    case 'unreachable':
      return 'text-red-600'
    default:
      return 'text-gray-600'
  }
}

export function DeviceSelector({ 
  devices, 
  selectedDevice, 
  onDeviceSelect, 
  onRefresh,
  className,
  compact = false 
}: DeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.device_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.ip_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         device.hostname?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || device.device_type === filterType
    const matchesStatus = filterStatus === 'all' || device.is_reachable === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const reachableDevices = devices.filter(d => d.is_reachable === 'reachable')
  const deviceTypes = [...new Set(devices.map(d => d.device_type).filter((type): type is string => Boolean(type)))]

  if (compact) {
    return (
      <Select
        value={selectedDevice?.id || ''}
        onValueChange={(value) => {
          const device = devices.find(d => d.id === value) || null
          onDeviceSelect(device)
        }}
      >
        <SelectTrigger className={cn("w-48", className)}>
          <SelectValue placeholder="Select device..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All devices</SelectItem>
          {devices.map((device) => (
            <SelectItem key={device.id} value={device.id}>
              <div className="flex items-center gap-2">
                {getDeviceIcon(device.device_type)}
                <span>{device.device_name}</span>
                {getStatusIcon(device.is_reachable)}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="justify-between min-w-48">
            <div className="flex items-center gap-2">
              {selectedDevice ? (
                <>
                  {getDeviceIcon(selectedDevice.device_type)}
                  <span className="truncate">{selectedDevice.device_name}</span>
                  {getStatusIcon(selectedDevice.is_reachable)}
                </>
              ) : (
                <>
                  <IconDeviceDesktop className="h-4 w-4" />
                  <span>All devices</span>
                </>
              )}
            </div>
            <IconChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Select Device</h4>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {reachableDevices.length}/{devices.length} online
                </span>
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRefresh}
                    className="h-6 w-6 p-0"
                  >
                    <IconRefresh className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Device type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(type)}
                        <span className="capitalize">{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="reachable">
                    <div className="flex items-center gap-2">
                      <IconWifi className="h-3 w-3 text-green-500" />
                      <span>Reachable</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="unreachable">
                    <div className="flex items-center gap-2">
                      <IconWifiOff className="h-3 w-3 text-red-500" />
                      <span>Unreachable</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Device list */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {/* All devices option */}
              <div
                className={cn(
                  "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted",
                  !selectedDevice && "bg-muted"
                )}
                onClick={() => {
                  onDeviceSelect(null)
                  setIsOpen(false)
                }}
              >
                <div className="flex items-center gap-2">
                  <IconDeviceDesktop className="h-4 w-4" />
                  <span className="font-medium">All devices</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {devices.length}
                </Badge>
              </div>

              {filteredDevices.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No devices found
                </div>
              ) : (
                filteredDevices.map((device) => (
                  <div
                    key={device.id}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted",
                      selectedDevice?.id === device.id && "bg-muted"
                    )}
                    onClick={() => {
                      onDeviceSelect(device)
                      setIsOpen(false)
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getDeviceIcon(device.device_type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {device.device_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {device.ip_address}
                          {device.device_type && (
                            <> • {device.device_type}</>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={cn("text-xs", getStatusColor(device.is_reachable))}>
                        {device.is_reachable}
                      </span>
                      {getStatusIcon(device.is_reachable)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {selectedDevice && (
              <div className="pt-2 border-t">
                <div className="text-sm">
                  <div className="font-medium">Selected: {selectedDevice.device_name}</div>
                  <div className="text-muted-foreground">
                    {selectedDevice.ip_address}
                    {selectedDevice.device_type && (
                      <> • {selectedDevice.device_type}</>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}