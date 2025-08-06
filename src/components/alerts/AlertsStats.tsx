
import { 
  IconAlertTriangle, 
 
  IconClock, 
  IconTrendingUp,
  IconActivity
} from '@tabler/icons-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface AlertStats {
  time_period_hours: number
  total_alerts: number
  acknowledged_alerts: number
  unacknowledged_alerts: number
  recent_critical_alerts: number
  severity_breakdown: Record<string, number>
  top_devices: Record<string, number>
  hourly_activity: Array<{ hour: string; count: number }>
  last_updated: string
}

interface AlertsStatsProps {
  stats: AlertStats
  loading?: boolean
  className?: string
}

export function AlertsStats({ stats, loading = false, className }: AlertsStatsProps) {
  if (loading) {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded mb-2" />
              <div className="h-3 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const acknowledgmentRate = stats.total_alerts > 0 
    ? (stats.acknowledged_alerts / stats.total_alerts) * 100 
    : 0

  const criticalRate = stats.total_alerts > 0
    ? (stats.recent_critical_alerts / stats.total_alerts) * 100
    : 0

  // Calculate trend from hourly activity
  const recentActivity = stats.hourly_activity.slice(0, 6)
  const olderActivity = stats.hourly_activity.slice(6, 12)
  const recentSum = recentActivity.reduce((sum, item) => sum + item.count, 0)
  const olderSum = olderActivity.reduce((sum, item) => sum + item.count, 0)
  const trendDirection = recentSum > olderSum ? 'up' : recentSum < olderSum ? 'down' : 'stable'

  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
      {/* Total Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
          <IconActivity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total_alerts}</div>
          <p className="text-xs text-muted-foreground">
            Last {stats.time_period_hours} hours
          </p>
        </CardContent>
      </Card>

      {/* Unacknowledged Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
          <IconClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.unacknowledged_alerts}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress 
              value={100 - acknowledgmentRate} 
              className="flex-1 h-2"
            />
            <span className="text-xs text-muted-foreground">
              {(100 - acknowledgmentRate).toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Critical/High</CardTitle>
          <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {(stats.severity_breakdown.critical || 0) + (stats.severity_breakdown.high || 0)}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Progress 
              value={criticalRate} 
              className="flex-1 h-2"
            />
            <span className="text-xs text-muted-foreground">
              {criticalRate.toFixed(0)}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Alert Trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Trend</CardTitle>
          <IconTrendingUp className={cn(
            "h-4 w-4",
            trendDirection === 'up' ? "text-red-500" : 
            trendDirection === 'down' ? "text-green-500" : "text-muted-foreground"
          )} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {trendDirection === 'up' && '↗'}
            {trendDirection === 'down' && '↘'}
            {trendDirection === 'stable' && '→'}
          </div>
          <p className="text-xs text-muted-foreground">
            {trendDirection === 'up' && 'Increasing'}
            {trendDirection === 'down' && 'Decreasing'}
            {trendDirection === 'stable' && 'Stable'}
          </p>
        </CardContent>
      </Card>

      {/* Severity Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Severity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.severity_breakdown).map(([severity, count]) => (
              <Badge 
                key={severity}
                variant={
                  severity === 'critical' || severity === 'high' ? 'destructive' :
                  severity === 'medium' ? 'secondary' : 'outline'
                }
                className="flex items-center gap-1"
              >
                <span className="capitalize">{severity}</span>
                <span className="bg-background/20 px-1 rounded-sm">{count}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Affected Devices */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Affected Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(stats.top_devices).slice(0, 5).map(([device, count]) => (
              <div key={device} className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1 mr-2">
                  {device}
                </span>
                <div className="flex items-center gap-2">
                  <Progress 
                    value={(count / Math.max(...Object.values(stats.top_devices))) * 100}
                    className="w-16 h-2"
                  />
                  <span className="text-sm text-muted-foreground w-6 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}