import { useState, useEffect } from 'react'
import { useRouter, Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { 
  IconArrowLeft, 
  IconDeviceDesktop,
  IconWifi,
  IconServer,
  IconRouter,
  IconLoader,
  IconCheck,
  IconX
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const deviceTypes = [
  { value: 'router', label: 'Router', icon: IconRouter },
  { value: 'switch', label: 'Switch', icon: IconDeviceDesktop },
  { value: 'firewall', label: 'Firewall', icon: IconServer },
  { value: 'access_point', label: 'Access Point', icon: IconWifi },
  { value: 'server', label: 'Server', icon: IconServer },
  { value: 'generic', label: 'Generic Device', icon: IconDeviceDesktop },
  { value: 'unknown', label: 'Unknown Device', icon: IconDeviceDesktop },
]

const protocols = [
  { value: 'snmp', label: 'SNMP' },
  { value: 'ssh', label: 'SSH' },
  { value: 'rest', label: 'REST API' },
  { value: 'telnet', label: 'Telnet' },
]

const deviceFormSchema = z.object({
  name: z.string().min(1, 'Device name is required').max(100, 'Name must be less than 100 characters'),
  host: z.string().min(1, 'Host is required').refine(
    (value) => {
      // Basic validation for IP address or hostname
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
      const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      return ipRegex.test(value) || hostnameRegex.test(value)
    },
    'Please enter a valid IP address or hostname'
  ),
  device_type: z.enum(['router', 'switch', 'firewall', 'access_point', 'server', 'generic', 'unknown']),
  enabled_protocols: z.array(z.string()).min(1, 'At least one protocol must be selected'),
  description: z.string().optional(),
  timeout: z.number().min(1, 'Timeout must be at least 1 second').max(300, 'Timeout cannot exceed 300 seconds'),
  retry_count: z.number().min(0, 'Retry count cannot be negative').max(10, 'Retry count cannot exceed 10'),
  // Credentials (optional)
  snmp_community: z.string().optional(),
  snmp_version: z.enum(['v1', 'v2c', 'v3']).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  ssh_key: z.string().optional(),
  api_token: z.string().optional(),
  api_key: z.string().optional(),
})

type DeviceFormData = z.infer<typeof deviceFormSchema>

interface AddDeviceFormProps {
  deviceId?: string
}

export function AddDeviceForm({ deviceId }: AddDeviceFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionResult, setConnectionResult] = useState<{ success: boolean; message: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(!!deviceId)

  const form = useForm<DeviceFormData>({
    resolver: zodResolver(deviceFormSchema),
    defaultValues: {
      name: '',
      host: '',
      device_type: 'generic',
      enabled_protocols: ['snmp'],
      description: '',
      timeout: 30,
      retry_count: 3,
      snmp_community: 'public',
      snmp_version: 'v2c',
      username: '',
      password: '',
      ssh_key: '',
      api_token: '',
      api_key: '',
    },
  })

  const selectedProtocols = form.watch('enabled_protocols')
  const deviceType = form.watch('device_type')

  useEffect(() => {
    if (deviceId) {
      fetchDeviceData()
    }
  }, [deviceId])

  const fetchDeviceData = async () => {
    if (!deviceId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/devices/${deviceId}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Device not found')
        }
        if (response.status === 0 || response.status >= 500) {
          throw new Error('Backend server is not running. Please start the API server at localhost:8000')
        }
        throw new Error(`Failed to fetch device data: ${response.status} ${response.statusText}`)
      }
      
      const device = await response.json()
      
      // Populate form with existing device data
      form.reset({
        name: device.name,
        host: device.host,
        device_type: device.device_type,
        enabled_protocols: device.enabled_protocols || ['snmp'],
        description: device.description || '',
        timeout: device.timeout || 30,
        retry_count: device.retry_count || 3,
        snmp_community: device.credentials?.snmp_community || 'public',
        snmp_version: device.credentials?.snmp_version || 'v2c',
        username: device.credentials?.username || '',
        password: device.credentials?.password || '',
        ssh_key: device.credentials?.ssh_key || '',
        api_token: device.credentials?.api_token || '',
        api_key: device.credentials?.api_key || '',
      })
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to the backend server. Please make sure the API server is running on localhost:8000')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load device data')
      }
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: DeviceFormData) => {
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Prepare credentials object
      const credentials: any = {}
      
      if (selectedProtocols.includes('snmp')) {
        credentials.snmp_community = data.snmp_community
        credentials.snmp_version = data.snmp_version
      }
      
      if (selectedProtocols.includes('ssh') || selectedProtocols.includes('telnet')) {
        credentials.username = data.username
        credentials.password = data.password
        if (data.ssh_key) {
          credentials.ssh_key = data.ssh_key
        }
      }
      
      if (selectedProtocols.includes('rest')) {
        credentials.api_token = data.api_token
        credentials.api_key = data.api_key
      }

      const payload = {
        name: data.name,
        host: data.host,
        device_type: data.device_type,
        enabled_protocols: data.enabled_protocols,
        description: data.description || undefined,
        timeout: data.timeout,
        retry_count: data.retry_count,
        credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
      }

      const url = deviceId ? `/api/devices/${deviceId}` : '/api/devices/'
      const method = deviceId ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        if (response.status === 0 || response.status >= 500) {
          throw new Error('Backend server is not running. Please start the API server at localhost:8000')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `Failed to ${deviceId ? 'update' : 'create'} device: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      router.navigate({ to: `/devices/${deviceId || result.id}` })
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to the backend server. Please make sure the API server is running on localhost:8000')
      } else {
        setError(err instanceof Error ? err.message : `Failed to ${deviceId ? 'update' : 'create'} device`)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const testConnection = async () => {
    const formData = form.getValues()
    setTestingConnection(true)
    setConnectionResult(null)

    try {
      // For existing devices, use the test endpoint
      if (deviceId) {
        const response = await fetch(`/api/devices/${deviceId}/test`)
        const result = await response.json()
        setConnectionResult({
          success: response.ok,
          message: result.message || (response.ok ? 'Connection test successful' : 'Connection test failed'),
        })
      } else {
        // For new devices, we'll create a temporary device first, then test it
        // For now, show a message that testing is only available after device creation
        setConnectionResult({
          success: false,
          message: 'Connection testing is available after device creation. Please save the device first.',
        })
      }
    } catch (err) {
      setConnectionResult({
        success: false,
        message: 'Failed to test connection. Make sure the backend server is running.',
      })
    } finally {
      setTestingConnection(false)
    }
  }

  const selectedDeviceType = deviceTypes.find(type => type.value === deviceType)
  const IconComponent = selectedDeviceType?.icon || IconDeviceDesktop

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/devices">
            <IconArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          <IconComponent className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {deviceId ? 'Edit Device' : 'Add New Device'}
            </h1>
            <p className="text-muted-foreground">
              {deviceId ? 'Update device configuration and monitoring settings' : 'Configure a new network device for monitoring'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <IconX className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {connectionResult && (
        <Alert className={connectionResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {connectionResult.success ? (
            <IconCheck className="h-4 w-4 text-green-600" />
          ) : (
            <IconX className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={connectionResult.success ? 'text-green-800' : 'text-red-800'}>
            {connectionResult.message}
          </AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <IconLoader className="h-6 w-6 animate-spin mr-2" />
          <span>Loading device data...</span>
        </div>
      )}

      {!loading && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Core Router 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host (IP Address or Hostname)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 192.168.1.1 or router.local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="device_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select device type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {deviceTypes.map((type) => {
                            const TypeIcon = type.icon
                            return (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <TypeIcon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the device..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                    name="retry_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Retry Count</FormLabel>
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
              </CardContent>
            </Card>

            {/* Protocols & Credentials */}
            <Card>
              <CardHeader>
                <CardTitle>Protocols & Credentials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="enabled_protocols"
                  render={() => (
                    <FormItem>
                      <FormLabel>Enabled Protocols</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {protocols.map((protocol) => (
                          <FormField
                            key={protocol.value}
                            control={form.control}
                            name="enabled_protocols"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={protocol.value}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(protocol.value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, protocol.value])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== protocol.value
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {protocol.label}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* SNMP Credentials */}
                {selectedProtocols.includes('snmp') && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">SNMP Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="snmp_community"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Community String</FormLabel>
                            <FormControl>
                              <Input placeholder="public" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="snmp_version"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SNMP Version</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="v1">v1</SelectItem>
                                <SelectItem value="v2c">v2c</SelectItem>
                                <SelectItem value="v3">v3</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* SSH/Telnet Credentials */}
                {(selectedProtocols.includes('ssh') || selectedProtocols.includes('telnet')) && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">SSH/Telnet Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="admin" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {selectedProtocols.includes('ssh') && (
                      <FormField
                        control={form.control}
                        name="ssh_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SSH Private Key (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="-----BEGIN PRIVATE KEY-----"
                                className="resize-none font-mono text-xs"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Leave empty to use password authentication
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {/* REST API Credentials */}
                {selectedProtocols.includes('rest') && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">REST API Configuration</h4>
                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="api_token"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Token</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Bearer token or API token" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="api_key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>API Key (Optional)</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="API key if required" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={testConnection}
              disabled={testingConnection || !form.watch('host')}
            >
              {testingConnection ? (
                <IconLoader className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <IconCheck className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>

            <div className="flex items-center gap-2">
              <Button asChild variant="outline">
                <Link to="/devices">Cancel</Link>
              </Button>
                              <Button type="submit" disabled={isSubmitting || loading}>
                  {(isSubmitting || loading) ? (
                    <IconLoader className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {deviceId ? 'Update Device' : 'Create Device'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
      )}
    </div>
  )
} 