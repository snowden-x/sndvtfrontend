import { useState } from 'react'
import { AlertCard } from './AlertCard'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  IconChevronLeft, 
  IconChevronRight, 
  IconCheck,

} from '@tabler/icons-react'
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

interface AlertsListProps {
  alerts: Alert[]
  totalCount: number
  page: number
  pageSize: number
  hasNext: boolean
  loading?: boolean
  onPageChange?: (page: number) => void
  onAcknowledge?: (alertId: string) => void
  onAcknowledgeMultiple?: (alertIds: string[]) => void
  onViewDetails?: (alertId: string) => void
  className?: string
  compact?: boolean
  selectable?: boolean
}

export function AlertsList({ 
  alerts,
  totalCount,
  page,
  pageSize,
  hasNext,
  loading = false,
  onPageChange,
  onAcknowledge,
  onAcknowledgeMultiple,
  onViewDetails,
  className,
  compact = false,
  selectable = false
}: AlertsListProps) {
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())

  const handleSelectAlert = (alertId: string, checked: boolean) => {
    const newSelected = new Set(selectedAlerts)
    if (checked) {
      newSelected.add(alertId)
    } else {
      newSelected.delete(alertId)
    }
    setSelectedAlerts(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unacknowledgedIds = alerts
        .filter(alert => !alert.acknowledged)
        .map(alert => alert.id)
      setSelectedAlerts(new Set(unacknowledgedIds))
    } else {
      setSelectedAlerts(new Set())
    }
  }

  const handleAcknowledgeSelected = () => {
    if (onAcknowledgeMultiple && selectedAlerts.size > 0) {
      onAcknowledgeMultiple(Array.from(selectedAlerts))
      setSelectedAlerts(new Set())
    }
  }

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged)
  const allUnacknowledgedSelected = unacknowledgedAlerts.length > 0 && 
    unacknowledgedAlerts.every(alert => selectedAlerts.has(alert.id))

  const totalPages = Math.ceil(totalCount / pageSize)

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <IconCheck className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No alerts found</h3>
          <p>All clear! No alerts match your current filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Bulk actions */}
      {selectable && unacknowledgedAlerts.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            checked={allUnacknowledgedSelected}
            onCheckedChange={handleSelectAll}
            aria-label="Select all unacknowledged alerts"
          />
          <span className="text-sm">
            {selectedAlerts.size > 0 
              ? `${selectedAlerts.size} alert${selectedAlerts.size === 1 ? '' : 's'} selected`
              : 'Select all unacknowledged alerts'
            }
          </span>
          
          {selectedAlerts.size > 0 && (
            <Button
              size="sm"
              onClick={handleAcknowledgeSelected}
              className="ml-auto"
            >
              <IconCheck className="h-4 w-4 mr-2" />
              Acknowledge Selected
            </Button>
          )}
        </div>
      )}

      {/* Alerts list */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-3">
            {selectable && !alert.acknowledged && (
              <Checkbox
                checked={selectedAlerts.has(alert.id)}
                onCheckedChange={(checked) => handleSelectAlert(alert.id, checked as boolean)}
                className="mt-4"
                aria-label={`Select alert for ${alert.device}`}
              />
            )}
            
            <AlertCard
              alert={alert}
              onAcknowledge={onAcknowledge}
              onViewDetails={onViewDetails}
              compact={compact}
              className="flex-1"
            />
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} alerts
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
            >
              <IconChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (page <= 3) {
                  pageNum = i + 1
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = page - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange?.(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(page + 1)}
              disabled={!hasNext}
            >
              Next
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}