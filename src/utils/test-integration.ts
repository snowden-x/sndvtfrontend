/**
 * Integration test utilities for API connections
 */

import { alertsService } from '@/services/alerts'

export interface ServiceHealthCheck {
  service: string
  status: 'healthy' | 'unhealthy' | 'unknown'
  message: string
  timestamp: string
}

export async function testAlertsService(): Promise<ServiceHealthCheck> {
  try {
    const response = await alertsService.checkNetPredictHealth()
    
    if (response.error) {
      return {
        service: 'NetPredict Alerts',
        status: 'unhealthy',
        message: response.error,
        timestamp: new Date().toISOString()
      }
    }

    return {
      service: 'NetPredict Alerts',
      status: 'healthy',
      message: 'Connected successfully',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      service: 'NetPredict Alerts',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}



export async function testMainAPI(): Promise<ServiceHealthCheck> {
  try {
    // Test the main SNDVT API by trying to get alerts
    const response = await alertsService.getAlerts({ page: 1, page_size: 1 })
    
    if (response.error) {
      return {
        service: 'SNDVT API',
        status: 'unhealthy',
        message: response.error,
        timestamp: new Date().toISOString()
      }
    }

    return {
      service: 'SNDVT API',
      status: 'healthy',
      message: 'API endpoints responding',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      service: 'SNDVT API',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }
  }
}

export async function runAllHealthChecks(): Promise<ServiceHealthCheck[]> {
  const results = await Promise.allSettled([
    testMainAPI(),
    testAlertsService(),
    // testNetworkAgentService()
  ])

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    } else {
      const services = ['SNDVT API', 'NetPredict Alerts', 'Network Agent']
      return {
        service: services[index],
        status: 'unhealthy' as const,
        message: `Health check failed: ${result.reason}`,
        timestamp: new Date().toISOString()
      }
    }
  })
}