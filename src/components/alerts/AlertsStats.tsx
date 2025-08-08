import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AlertStats as AlertStatsType } from '@/services/alerts'

interface Props {
  stats: AlertStatsType
  loading?: boolean
}

export function AlertsStats({ stats, loading }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Total Alerts</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold tabular-nums">
          {loading ? '—' : stats.total_alerts}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Unacknowledged</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold tabular-nums">
          {loading ? '—' : stats.unacknowledged_alerts}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Critical (24h)</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-semibold tabular-nums">
          {loading ? '—' : stats.recent_critical_alerts}
        </CardContent>
      </Card>
    </div>
  )
}
 