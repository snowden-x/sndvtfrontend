import React from 'react'
import { formatDistanceToNow } from 'date-fns'
import { 
  IconAlertTriangle, 
  IconAlertCircle, 
  IconInfoCircle, 
  IconCheck,
  IconClock,
  IconDevices
} from '@tabler/icons-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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

interface AlertCardProps {
  alert: Alert
  onAcknowledge?: (alertId: string) => void
  onViewDetails?: (alertId: string) => void
  className?: string
  compact?: boolean
}

const getSeverityIcon = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return <IconAlertTriangle className="h-4 w-4" />
    case 'high':
      return <IconAlertTriangle className="h-4 w-4" />
    case 'medium':
      return <IconAlertCircle className="h-4 w-4" />
    case 'low':
      return <IconInfoCircle className="h-4 w-4" />
    default:
      return <IconInfoCircle className="h-4 w-4" />
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

const getSeverityBorderColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'border-l-red-500'
    case 'high':
      return 'border-l-orange-500'
    case 'medium':
      return 'border-l-yellow-500'
    case 'low':
      return 'border-l-blue-500'
    default:
      return 'border-l-gray-500'
  }
}

export function AlertCard({ 
  alert, 
  onAcknowledge, 
  onViewDetails, 
  className,
  compact = false 
}: AlertCardProps) {
  const handleAcknowledge = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAcknowledge && !alert.acknowledged) {
      onAcknowledge(alert.id)
    }
  }

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(alert.id)
    }
  }

  return (
    <Card 
      className={cn(
        "border-l-4 cursor-pointer transition-all hover:shadow-md",
        getSeverityBorderColor(alert.severity),
        alert.acknowledged && "opacity-75",
        className
      )}
      onClick={handleViewDetails}
    >
      <CardHeader className={cn("pb-2", compact && "pb-1")}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getSeverityIcon(alert.severity)}
            <Badge 
              variant={getSeverityColor(alert.severity)}
              className="text-xs font-medium"
            >
              {alert.severity.toUpperCase()}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {alert.acknowledged ? (
              <div className="flex items-center gap-1 text-green-600">
                <IconCheck className="h-3 w-3" />
                <span className="text-xs">Acknowledged</span>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAcknowledge}
                className="h-6 px-2 text-xs"
              >
                Acknowledge
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("pt-0", compact && "py-2")}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <IconDevices className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{alert.device}</span>
            {alert.interface && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{alert.interface}</span>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {alert.message}
          </p>

          {!compact && (
            <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span>Cause: {alert.cause}</span>
                <span>Probability: {(alert.probability * 100).toFixed(1)}%</span>
              </div>
              
              <div className="flex items-center gap-1">
                <IconClock className="h-3 w-3" />
                <span>{alert.age_minutes.toFixed(0)}m ago</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}