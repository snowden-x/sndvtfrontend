import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { 
  IconRefresh, 
  IconCheck, 
  IconX,

  IconActivity,
  IconTerminal,
  IconAlertTriangle
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { runAllHealthChecks } from '@/utils/test-integration'
import type { ServiceHealthCheck } from '@/utils/test-integration'

export const Route = createFileRoute('/_authenticated/debug')({
  component: DebugPage,
})

function DebugPage() {
  const [healthChecks, setHealthChecks] = useState<ServiceHealthCheck[]>([])
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    try {
      const results = await runAllHealthChecks()
      setHealthChecks(results)
    } catch (error) {
      console.error('Failed to run health checks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <IconCheck className="h-5 w-5 text-green-500" />
      case 'unhealthy':
        return <IconX className="h-5 w-5 text-red-500" />
      default:
        return <IconActivity className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600'
      case 'unhealthy':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getServiceIcon = (service: string) => {
    if (service.includes('API')) return <IconTerminal className="h-5 w-5" />
    if (service.includes('Alert')) return <IconAlertTriangle className="h-5 w-5" />
    return <IconActivity className="h-5 w-5" />
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integration Debug</h1>
            <p className="text-muted-foreground">
              Test connections to all integrated services
            </p>
          </div>
          
          <Button onClick={runTests} disabled={loading}>
            <IconRefresh className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Testing...' : 'Run Tests'}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {healthChecks.length === 0 && loading ? (
            Array.from({ length: 3 }).map((_, i) => (
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
            ))
          ) : (
            healthChecks.map((check, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    {getServiceIcon(check.service)}
                    <CardTitle className="text-base">{check.service}</CardTitle>
                  </div>
                  {getStatusIcon(check.status)}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge 
                        variant={check.status === 'healthy' ? 'default' : 'destructive'}
                        className="capitalize"
                      >
                        {check.status}
                      </Badge>
                    </div>
                    
                    <div className="text-sm">
                      <span className="text-muted-foreground">Message:</span>
                      <p className={`mt-1 ${getStatusColor(check.status)}`}>
                        {check.message}
                      </p>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Last checked: {new Date(check.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {healthChecks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Environment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Base URL:</span>
                  <span className="font-mono">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Environment:</span>
                  <span className="font-mono">{import.meta.env.MODE}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build Time:</span>
                  <span className="font-mono">{new Date().toISOString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Integration Status Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">✅ Completed Integrations</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• NetPredict alerts integration with real-time display</li>
                  <li>• Network AI Agent chat interface replacing Streamlit</li>
                  <li>• Device discovery and management system</li>
                  <li>• Alert acknowledgment and filtering system</li>
                  <li>• Command suggestions and execution interface</li>
                  <li>• Enhanced dashboard with alert widgets</li>
                  <li>• Unified navigation and routing system</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">🔄 Next Steps</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Start NetPredict service on port 8002</li>
                  <li>• Start Network AI Agent service on port 8001</li>
                  <li>• Run database migrations for new tables</li>
                  <li>• Configure environment variables</li>
                  <li>• Test real API endpoints</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}