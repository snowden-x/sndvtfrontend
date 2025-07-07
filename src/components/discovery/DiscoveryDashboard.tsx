import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { 
  IconRadar, 
  IconHistory, 
  IconDeviceDesktop, 
  IconNetwork,
  IconPlus,
  IconClock,
  IconCheck,
  IconX,
  IconLoader
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ScanHistory {
  scan_id: string
  scan_name?: string
  network: string
  scan_type: string
  status: 'running' | 'completed' | 'failed'
  started_at: string
  completed_at?: string
  device_count: number
  created_by?: string
}

const statusColors = {
  running: 'bg-blue-500',
  completed: 'bg-green-500', 
  failed: 'bg-red-500',
}

const statusIcons = {
  running: IconLoader,
  completed: IconCheck,
  failed: IconX,
}

export function DiscoveryDashboard() {
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchScanHistory()
  }, [])

  const fetchScanHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/devices/discovery/history')
      if (!response.ok) {
        if (response.status === 0 || response.status >= 500) {
          throw new Error('Backend server is not running. Please start the API server at localhost:8000')
        }
        throw new Error(`Failed to fetch scan history: ${response.status} ${response.statusText}`)
      }
      const data = await response.json()
      // Ensure data is an array
      setScanHistory(Array.isArray(data) ? data : [])
      setError(null)
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to the backend server. Please make sure the API server is running on localhost:8000')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load scan history')
      }
      // Set empty array on error to prevent filter issues
      setScanHistory([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert>
          <IconX className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        {error.includes('Backend server') && (
          <div className="text-sm text-muted-foreground p-4 bg-muted rounded-lg">
            <p className="font-medium mb-2">To start the backend server:</p>
            <code className="block text-xs bg-background p-2 rounded border">
              python start_optimized.py
            </code>
            <p className="mt-2">Server should be available at localhost:8000.</p>
          </div>
        )}
        <Button onClick={fetchScanHistory} variant="outline">
          Retry
        </Button>
      </div>
    )
  }

  const totalScans = scanHistory.length
  const completedScans = scanHistory.filter(scan => scan.status === 'completed').length
  const totalDevicesFound = scanHistory.reduce((sum, scan) => sum + scan.device_count, 0)

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <IconRadar className="h-4 w-4" />
              Total Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalScans}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <IconCheck className="h-4 w-4" />
              Completed Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedScans}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <IconDeviceDesktop className="h-4 w-4" />
              Devices Discovered
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDevicesFound}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Button asChild>
          <Link to="/discovery/scan">
            <IconRadar className="h-4 w-4 mr-2" />
            Start New Scan
          </Link>
        </Button>
        <Button variant="outline" onClick={fetchScanHistory}>
          <IconHistory className="h-4 w-4 mr-2" />
          Refresh History
        </Button>
      </div>

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconHistory className="h-5 w-5" />
            Recent Discovery Scans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scanHistory.length === 0 ? (
            <div className="text-center py-8">
              <IconNetwork className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No scans yet</h3>
              <p className="text-muted-foreground mb-4">
                Start your first network discovery scan to find devices on your network.
              </p>
              <Button asChild>
                <Link to="/discovery/scan">
                  <IconPlus className="h-4 w-4 mr-2" />
                  Start First Scan
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.slice(0, 10).map((scan) => {
                const StatusIcon = statusIcons[scan.status]
                return (
                  <div key={scan.scan_id} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${statusColors[scan.status]}`} />
                      <div>
                        <div className="font-medium">{scan.network}</div>
                        <div className="text-sm text-muted-foreground">
                          {scan.scan_type} scan • {new Date(scan.started_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <div className="font-medium">{scan.device_count} devices</div>
                        <div className="text-muted-foreground">
                          {scan.scan_name || 'Network scan'}
                        </div>
                      </div>
                      <Badge variant={scan.status === 'completed' ? 'default' : scan.status === 'running' ? 'secondary' : 'destructive'}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {scan.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 