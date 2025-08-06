import { useState, useEffect } from 'react'
import { 
  IconAlertTriangle,
  IconX,
  IconEye
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AlertNotificationProps {
  className?: string
  autoHide?: boolean
  hideDelay?: number
}

interface NewAlert {
  id: string
  device: string
  severity: string
  message: string
  timestamp: string
}

export function AlertNotification({ 
  className, 
  autoHide = true, 
  hideDelay = 5000 
}: AlertNotificationProps) {
  const [notifications, setNotifications] = useState<NewAlert[]>([])
  const [visible, setVisible] = useState(false)

  // Mock function to simulate new alerts - replace with real WebSocket/SSE
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly show a new alert for demo purposes
      if (Math.random() > 0.95) { // 5% chance every second
        const mockAlert: NewAlert = {
          id: Date.now().toString(),
          device: `Device-${Math.floor(Math.random() * 100)}`,
          severity: ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)],
          message: 'New network alert detected',
          timestamp: new Date().toISOString()
        }
        
        setNotifications(prev => [mockAlert, ...prev.slice(0, 4)]) // Keep max 5 notifications
        setVisible(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Auto-hide notification
  useEffect(() => {
    if (visible && autoHide) {
      const timer = setTimeout(() => {
        setVisible(false)
      }, hideDelay)

      return () => clearTimeout(timer)
    }
  }, [visible, autoHide, hideDelay])

  const handleDismiss = () => {
    setVisible(false)
  }

  const handleViewAlerts = () => {
    // Navigate to alerts page
    window.location.href = '/alerts'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-500 border-red-600'
      case 'high':
        return 'bg-orange-500 border-orange-600'
      case 'medium':
        return 'bg-yellow-500 border-yellow-600'
      default:
        return 'bg-blue-500 border-blue-600'
    }
  }

  if (!visible || notifications.length === 0) {
    return null
  }

  const latestAlert = notifications[0]
  const additionalCount = notifications.length - 1

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]",
      "animate-in slide-in-from-right-full duration-300",
      className
    )}>
      <div className={cn(
        "rounded-lg border-l-4 bg-background/95 backdrop-blur shadow-lg",
        getSeverityColor(latestAlert.severity)
      )}>
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <IconAlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <h4 className="font-medium">New Alert</h4>
                <p className="text-sm text-muted-foreground">
                  {latestAlert.device}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge 
                variant={latestAlert.severity === 'critical' || latestAlert.severity === 'high' 
                  ? 'destructive' 
                  : 'secondary'
                }
                className="text-xs"
              >
                {latestAlert.severity.toUpperCase()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0"
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm mt-2 text-muted-foreground">
            {latestAlert.message}
          </p>

          {additionalCount > 0 && (
            <p className="text-xs mt-2 text-muted-foreground">
              + {additionalCount} more alert{additionalCount === 1 ? '' : 's'}
            </p>
          )}

          <div className="flex items-center gap-2 mt-4">
            <Button
              size="sm"
              onClick={handleViewAlerts}
              className="flex-1"
            >
              <IconEye className="h-4 w-4 mr-2" />
              View All Alerts
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}