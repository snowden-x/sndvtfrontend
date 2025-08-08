import { useState, useEffect, useCallback, useRef } from 'react'
import { AlertsList } from './AlertsList'
import { AlertsStats } from './AlertsStats'
import { AlertsFilters } from './AlertsFilters'
import { AlertNotification } from './AlertNotification'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { alertsService } from '@/services/alerts'
import type { AlertWithUser, AlertStats, AlertFilters } from '@/services/alerts'

// Interfaces now imported from service

interface AlertsManagerProps {
  className?: string
  compact?: boolean
  showTabs?: boolean
  defaultTab?: string
}

// Real API integration

export function AlertsManager({ 
  className, 
  compact = false, 
  showTabs = true,
  defaultTab = 'alerts'
}: AlertsManagerProps) {
  const [alerts, setAlerts] = useState<AlertWithUser[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [filters, setFilters] = useState<AlertFilters>({ hours_back: 24 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  // Using Sonner toast

  const pageSize = compact ? 10 : 20

  const didInitialSyncRef = useRef(false)
  const { isAuthenticated, isLoading } = useAuth()

  const fetchAlerts = useCallback(async () => {
    setLoading(true)
    try {
      const response = await alertsService.getAlertsWithUsers({
        ...filters,
        page,
        page_size: pageSize
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (response.data) {
        setAlerts(response.data.alerts)
      }
    } catch (error) {
      toast.error("Failed to fetch alerts")
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const response = await alertsService.getAlertStats(filters.hours_back)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      if (response.data) {
        setStats(response.data)
      }
    } catch (error) {
      toast.error("Failed to fetch alert statistics")
    } finally {
      setStatsLoading(false)
    }
  }, [filters.hours_back])

  const handleAcknowledge = async (alertId: string) => {
    try {
      const response = await alertsService.acknowledgeAlert(alertId)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true, acknowledged_at: new Date().toISOString() }
          : alert
      ))
      
      toast.success("Alert acknowledged successfully")
    } catch (error) {
      toast.error("Failed to acknowledge alert")
    }
  }

  const handleAcknowledgeMultiple = async (alertIds: string[]) => {
    try {
      const response = await alertsService.acknowledgeMultipleAlerts(alertIds)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      setAlerts(prev => prev.map(alert => 
        alertIds.includes(alert.id)
          ? { ...alert, acknowledged: true, acknowledged_at: new Date().toISOString() }
          : alert
      ))
      
      toast.success(`${alertIds.length} alert${alertIds.length === 1 ? '' : 's'} acknowledged successfully`)
    } catch (error) {
      toast.error("Failed to acknowledge alerts")
    }
  }

  const handleViewDetails = (alertId: string) => {
    // Navigate to alert details page
    console.log('View details for alert:', alertId)
  }

  const handleRefresh = () => {
    const refresh = async () => {
      // Try to sync from NetPredict first
      await alertsService.syncAlerts()
      fetchAlerts()
      fetchStats()
    }
    refresh()
  }

  const handleExport = () => {
    // Implement export functionality
    toast.info("Export functionality will be implemented")
  }

  const handleFiltersChange = (newFilters: AlertFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    // On first authenticated mount, attempt to sync from NetPredict so DB has freshest alerts
    if (!didInitialSyncRef.current) {
      didInitialSyncRef.current = true
      ;(async () => {
        await alertsService.syncAlerts()
        fetchAlerts()
        fetchStats()
      })()
      return
    }
    fetchAlerts()
  }, [isAuthenticated, isLoading, fetchAlerts, fetchStats])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Auto-refresh alerts every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts()
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchAlerts, fetchStats])

  if (!showTabs) {
    return (
      <div className={cn("space-y-6", className)}>
        <AlertsFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onRefresh={handleRefresh}
          onExport={handleExport}
          loading={loading}
        />
        
        {stats && (
          <AlertsStats stats={stats} loading={statsLoading} />
        )}
        
        <AlertsList
          alerts={alerts}
          totalCount={alerts.length}
          page={page}
          pageSize={pageSize}
          hasNext={false}
          loading={loading}
          onPageChange={setPage}
          onAcknowledge={handleAcknowledge}
          onAcknowledgeMultiple={handleAcknowledgeMultiple}
          onViewDetails={handleViewDetails}
          compact={compact}
          selectable={true}
        />
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {import.meta.env.DEV && <AlertNotification />}
      
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="alerts" className="space-y-4">
          <AlertsFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onRefresh={handleRefresh}
            onExport={handleExport}
            loading={loading}
          />
          
          <AlertsList
            alerts={alerts}
            totalCount={alerts.length}
            page={page}
            pageSize={pageSize}
            hasNext={false}
            loading={loading}
            onPageChange={setPage}
            onAcknowledge={handleAcknowledge}
            onAcknowledgeMultiple={handleAcknowledgeMultiple}
            onViewDetails={handleViewDetails}
            compact={compact}
            selectable={true}
          />
        </TabsContent>
        
        <TabsContent value="statistics" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Alert Statistics</h3>
            <AlertsFilters
              filters={{ hours_back: filters.hours_back }}
              onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
              onRefresh={handleRefresh}
              loading={statsLoading}
              className="flex-shrink-0"
            />
          </div>
          
          {stats && (
            <AlertsStats stats={stats} loading={statsLoading} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}