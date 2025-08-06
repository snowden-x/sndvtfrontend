/**
 * Alerts API service
 */

import { apiClient } from '@/lib/api'

export interface Alert {
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

export interface AlertStats {
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

export interface AlertFilters {
  severity?: string
  acknowledged?: boolean
  device?: string
  hours_back?: number
  page?: number
  page_size?: number
}

export interface AlertsListResponse {
  alerts: Alert[]
  total_count: number
  page: number
  page_size: number
  has_next: boolean
}

class AlertsService {
  /**
   * Get alerts with filtering and pagination
   */
  async getAlerts(filters: AlertFilters = {}) {
    const params = {
      page: filters.page || 1,
      page_size: filters.page_size || 50,
      severity: filters.severity,
      acknowledged: filters.acknowledged,
      device: filters.device,
      hours_back: filters.hours_back,
    }

    return apiClient.get<AlertsListResponse>('/alerts', params)
  }

  /**
   * Get a specific alert by ID
   */
  async getAlert(alertId: string) {
    return apiClient.get<Alert>(`/alerts/${alertId}`)
  }

  /**
   * Acknowledge a specific alert
   */
  async acknowledgeAlert(alertId: string) {
    return apiClient.post<Alert>(`/alerts/${alertId}/acknowledge`)
  }

  /**
   * Acknowledge multiple alerts
   */
  async acknowledgeMultipleAlerts(alertIds: string[]) {
    return apiClient.post('/alerts/acknowledge', { alert_ids: alertIds })
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(hoursBack: number = 24) {
    return apiClient.get<AlertStats>('/alerts/stats/summary', { hours_back: hoursBack })
  }

  /**
   * Manually sync alerts from NetPredict
   */
  async syncAlerts() {
    return apiClient.post('/alerts/sync')
  }

  /**
   * Check NetPredict service health
   */
  async checkNetPredictHealth() {
    return apiClient.get('/alerts/health/netpredict')
  }

  /**
   * Trigger a new prediction
   */
  async triggerPrediction(minutesBack: number = 20) {
    return apiClient.post('/alerts/predict', undefined, { minutes_back: minutesBack })
  }

  /**
   * Trigger model training (admin only)
   */
  async triggerModelTraining(daysBack: number = 7) {
    return apiClient.post('/alerts/train', undefined, { days_back: daysBack })
  }

  /**
   * Get model information
   */
  async getModelInfo() {
    return apiClient.get('/alerts/model/info')
  }
}

export const alertsService = new AlertsService()