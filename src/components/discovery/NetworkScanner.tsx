import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  IconRadar, 
  IconNetwork, 
  IconSettings,
  IconDeviceDesktop,
  IconLoader,
  IconCheck,
  IconArrowLeft
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

const scanFormSchema = z.object({
  network: z.string().min(1, 'Network range is required').refine(
    (value) => {
      // Validate CIDR notation (e.g., 192.168.1.0/24)
      const cidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:[0-9]|[1-2][0-9]|3[0-2])$/
      // Also allow single IP
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      return cidrRegex.test(value) || ipRegex.test(value)
    },
    'Please enter a valid IP address or CIDR notation (e.g., 192.168.1.0/24)'
  ),
  scan_type: z.enum(['ping', 'port', 'full']),
  timeout: z.number().min(1, 'Timeout must be at least 1 second').max(60, 'Timeout cannot exceed 60 seconds'),
  max_concurrent: z.number().min(1, 'Must allow at least 1 concurrent scan').max(100, 'Cannot exceed 100 concurrent scans'),
  snmp_communities: z.array(z.string()).optional(),
  ports: z.array(z.number()).optional(),
})

type ScanFormData = z.infer<typeof scanFormSchema>

interface DiscoveredDevice {
  host: string
  hostname?: string
  device_type?: string
  manufacturer?: string
  model?: string
  os_version?: string
  snmp_info?: any
  open_ports?: number[]
  suggested_protocols: string[]
}

interface ScanStatus {
  scan_id: string
  network: string
  scan_type: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  total_hosts: number
  scanned_hosts: number
  discovered_devices: DiscoveredDevice[]
  error_message?: string
}

export function NetworkScanner() {
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [customPorts, setCustomPorts] = useState('')
  const [customCommunities, setCustomCommunities] = useState('')

  const form = useForm<ScanFormData>({
    resolver: zodResolver(scanFormSchema),
    defaultValues: {
      network: '192.168.1.0/24',
      scan_type: 'ping',
      timeout: 5,
      max_concurrent: 50,
      snmp_communities: ['public', 'private'],
      ports: [22, 23, 80, 161, 443, 8080],
    },
  })

  const onSubmit = async (data: ScanFormData) => {
    setIsScanning(true)
    setError(null)
    setScanStatus(null)

    try {
      // Parse custom ports
      const ports = customPorts ? customPorts.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p)) : data.ports

      // Parse custom SNMP communities
      const snmp_communities = customCommunities ? customCommunities.split(',').map(c => c.trim()) : data.snmp_communities

      const payload = {
        network: data.network,
        scan_type: data.scan_type,
        timeout: data.timeout,
        max_concurrent: data.max_concurrent,
        snmp_communities,
        ports,
      }

      const response = await fetch('/api/devices/discovery/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Failed to start scan: ${response.status} ${response.statusText}`)
      }

      const scanResult = await response.json()
      setScanStatus(scanResult)

      // Start polling for updates
      pollScanStatus(scanResult.scan_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start scan')
      setIsScanning(false)
    }
  }

  const pollScanStatus = async (scanId: string) => {
    try {
      const response = await fetch(`/api/devices/discovery/scan/${scanId}`)
      if (response.ok) {
        const status = await response.json()
        setScanStatus(status)

        if (status.status === 'running') {
          // Continue polling
          setTimeout(() => pollScanStatus(scanId), 2000)
        } else {
          setIsScanning(false)
        }
      }
    } catch (err) {
      console.error('Failed to poll scan status:', err)
      setIsScanning(false)
    }
  }

  const stopScan = async () => {
    if (scanStatus) {
      try {
        await fetch(`/api/devices/discovery/scan/${scanStatus.scan_id}`, {
          method: 'DELETE'
        })
        setIsScanning(false)
        setScanStatus(null)
      } catch (err) {
        console.error('Failed to stop scan:', err)
      }
    }
  }

  const addDiscoveredDevices = async () => {
    if (!scanStatus) return

    try {
      const response = await fetch(`/api/devices/discovery/scan/${scanStatus.scan_id}/add-devices`, {
        method: 'POST'
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`Successfully added ${result.added_devices?.length || 0} devices to configuration`)
        router.navigate({ to: '/devices' })
      } else {
        throw new Error('Failed to add devices')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add devices')
    }
  }

  const progressPercentage = scanStatus 
    ? Math.round((scanStatus.scanned_hosts / scanStatus.total_hosts) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.history.back()}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconNetwork className="h-5 w-5" />
            Network Scan Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="network"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network Range</FormLabel>
                      <FormControl>
                        <Input placeholder="192.168.1.0/24" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter an IP address or CIDR notation (e.g., 192.168.1.0/24)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scan_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scan Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scan type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ping">Ping Scan (Fast)</SelectItem>
                          <SelectItem value="port">Port Scan (Medium)</SelectItem>
                          <SelectItem value="full">Full Scan (Comprehensive)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Ping: Check host availability • Port: Check common ports • Full: Deep scan with SNMP
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Collapsible open={showAdvancedOptions} onOpenChange={setShowAdvancedOptions}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" type="button">
                    <IconSettings className="h-4 w-4 mr-2" />
                    Advanced Options
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="timeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timeout (seconds)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="max_concurrent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Concurrent Scans</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="custom-ports">Custom Ports (comma-separated)</Label>
                      <Input
                        id="custom-ports"
                        placeholder="22,23,80,161,443,8080"
                        value={customPorts}
                        onChange={(e) => setCustomPorts(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="custom-communities">SNMP Communities (comma-separated)</Label>
                      <Input
                        id="custom-communities"
                        placeholder="public,private"
                        value={customCommunities}
                        onChange={(e) => setCustomCommunities(e.target.value)}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="flex gap-4">
                <Button type="submit" disabled={isScanning}>
                  {isScanning ? (
                    <>
                      <IconLoader className="h-4 w-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <IconCheck className="h-4 w-4 mr-2" />
                      Start Scan
                    </>
                  )}
                </Button>
                
                {isScanning && (
                  <Button variant="destructive" onClick={stopScan}>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Stop Scan
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {error && (
        <Alert>
          <IconCheck className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {scanStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <IconRadar className="h-5 w-5" />
                Scan Progress
              </span>
              <Badge variant={scanStatus.status === 'completed' ? 'default' : scanStatus.status === 'running' ? 'secondary' : 'destructive'}>
                {scanStatus.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress: {scanStatus.scanned_hosts}/{scanStatus.total_hosts} hosts</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{scanStatus.scanned_hosts}</div>
                <div className="text-sm text-muted-foreground">Hosts Scanned</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{scanStatus.discovered_devices.length}</div>
                <div className="text-sm text-muted-foreground">Devices Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{scanStatus.total_hosts}</div>
                <div className="text-sm text-muted-foreground">Total Hosts</div>
              </div>
            </div>

            {scanStatus.discovered_devices.length > 0 && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium mb-3">Discovered Devices</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {scanStatus.discovered_devices.map((device, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <IconDeviceDesktop className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{device.hostname || device.host}</div>
                            <div className="text-sm text-muted-foreground">
                              {device.host} • {device.device_type || 'Unknown type'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {device.suggested_protocols.map((protocol) => (
                            <Badge key={protocol} variant="outline" className="text-xs">
                              {protocol}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {scanStatus.status === 'completed' && scanStatus.discovered_devices.length > 0 && (
              <div className="flex gap-4">
                <Button onClick={addDiscoveredDevices}>
                  <IconCheck className="h-4 w-4 mr-2" />
                  Add All Devices
                </Button>
                <Button variant="outline" onClick={() => router.navigate({ to: '/devices' })}>
                  View Device List
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 