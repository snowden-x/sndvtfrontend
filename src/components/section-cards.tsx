import { useEffect, useState } from "react"
import { IconAlertTriangle, IconBell, IconClock, IconCheck } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardAction, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { alertsService, type AlertStats } from "@/services/alerts"
import { toast } from "sonner"

export function SectionCards() {
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const res = await alertsService.getAlertStats(24)
        if (res.error) throw new Error(res.error)
        if (res.data) setStats(res.data)
      } catch (e) {
        toast.error("Failed to load alert statistics")
      } finally {
        setLoading(false)
      }
    }
    loadStats()
  }, [])

  const total = stats?.total_alerts ?? 0
  const unack = stats?.unacknowledged_alerts ?? 0
  const critical = stats?.recent_critical_alerts ?? 0
  const lastUpdated = stats?.last_updated ? new Date(stats.last_updated).toLocaleTimeString() : "—"

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Alerts (24h)</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {loading ? '—' : total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconBell />
              All
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">All alerts generated in the selected window</div>
          <div className="text-muted-foreground">Last updated: {lastUpdated}</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Unacknowledged</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {loading ? '—' : unack}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconClock />
              Pending
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">Require attention</div>
          <div className="text-muted-foreground">Acknowledge to silence</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Critical (24h)</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {loading ? '—' : critical}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconAlertTriangle />
              Critical
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">Recent critical events</div>
          <div className="text-muted-foreground">Investigate immediately</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Acknowledged (24h)</CardDescription>
          <CardTitle className="text-3xl font-semibold tabular-nums">
            {loading ? '—' : (stats ? stats.acknowledged_alerts : 0)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconCheck />
              Resolved
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="font-medium">Acknowledged or muted alerts</div>
          <div className="text-muted-foreground">Keep backlog low</div>
        </CardFooter>
      </Card>
    </div>
  )
}
