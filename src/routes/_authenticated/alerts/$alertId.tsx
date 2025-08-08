import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  IconArrowLeft, 
  IconCheck, 
  IconClock,
  IconDevices,
  IconAlertTriangle,
  IconMapPin
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { alertsService } from '@/services/alerts'
import { Link } from '@tanstack/react-router'
import { formatDistanceToNow } from 'date-fns'

interface Alert {
  id: string
  timestamp: string
  probability: number
  prediction: number
  cause: string
  device: string
  interface?: string
  severity: string
  message: string
  acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
  created_at: string
  age_minutes: number
  is_critical: boolean
}

export const Route = createFileRoute('/_authenticated/alerts/$alertId')({
  component: AlertDetailsPage,
})

function AlertDetailsPage() {
  const { alertId } = Route.useParams()
  const [alert, setAlert] = useState<Alert | null>(null)
  const [loading, setLoading] = useState(true)
  // Using Sonner toast

  useEffect(() => {
    const fetchAlert = async () => {
      setLoading(true)
      try {
        const response = await alertsService.getAlert(alertId)
        if (response.error) throw new Error(response.error)
        if (response.data) setAlert(response.data as unknown as Alert)
      } catch (error) {
        toast.error("Failed to load alert details")
      } finally {
        setLoading(false)
      }
    }
    fetchAlert()
  }, [alertId])

  const handleAcknowledge = async () => {
    if (!alert) return
    
    try {
      const response = await alertsService.acknowledgeAlert(alert.id)
      if (response.error) throw new Error(response.error)
      setAlert(prev => prev ? {
        ...prev,
        acknowledged: true,
        acknowledged_by: prev.acknowledged_by || 'You',
        acknowledged_at: new Date().toISOString()
      } : null)
      toast.success("Alert acknowledged successfully")
    } catch (error) {
      toast.error("Failed to acknowledge alert")
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getSeverityIcon = (_severity: string) => {
    return <IconAlertTriangle className="h-5 w-5" />
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2 space-y-6">
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
          <div className="space-y-6">
            <div className="h-32 bg-muted animate-pulse rounded-lg" />
            <div className="h-48 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (!alert) {
    return (
      <div className="text-center py-12">
        <IconAlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Alert not found</h3>
        <p className="text-muted-foreground mb-4">
          The alert you're looking for doesn't exist or may have been removed.
        </p>
        <Link to="/alerts">
          <Button>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Alerts
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/alerts">
            <Button variant="outline" size="sm">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Alerts
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {getSeverityIcon(alert.severity)}
            <Badge variant={getSeverityColor(alert.severity)}>
              {alert.severity.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Alert ID: {alert.id}
            </span>
          </div>
        </div>

        {!alert.acknowledged && (
          <Button onClick={handleAcknowledge}>
            <IconCheck className="h-4 w-4 mr-2" />
            Acknowledge Alert
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Alert overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconDevices className="h-5 w-5" />
                Alert Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-lg">{alert.device}</h3>
                {alert.interface && (
                  <p className="text-sm text-muted-foreground">
                    Interface: {alert.interface}
                  </p>
                )}
              </div>
              
              <Separator />
              
              <p className="text-muted-foreground leading-relaxed">
                {alert.message}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <label className="text-sm font-medium">Prediction Confidence</label>
                  <p className="text-2xl font-bold text-destructive">
                    {(alert.probability * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Root Cause</label>
                  <p className="text-lg font-medium">{alert.cause}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Prediction Value
                  </label>
                  <p>{alert.prediction}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Alert Age
                  </label>
                  <p>{alert.age_minutes.toFixed(0)} minutes</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Detected At
                  </label>
                  <p>{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Created At
                  </label>
                  <p>{new Date(alert.created_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconClock className="h-5 w-5" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alert.acknowledged ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <IconCheck className="h-4 w-4" />
                    <span className="font-medium">Acknowledged</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>By: {alert.acknowledged_by}</p>
                    <p>
                      {formatDistanceToNow(new Date(alert.acknowledged_at!), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <IconClock className="h-4 w-4" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Requires acknowledgment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Device information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconMapPin className="h-5 w-5" />
                Device Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Device Name
                </label>
                <p className="font-medium">{alert.device}</p>
              </div>
              {alert.interface && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Interface
                  </label>
                  <p className="font-medium">{alert.interface}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Severity Level
                </label>
                <Badge variant={getSeverityColor(alert.severity)} className="mt-1">
                  {alert.severity.toUpperCase()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}