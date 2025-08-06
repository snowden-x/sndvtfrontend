/**
 * Network Agent API service
 */

import { apiClient } from '@/lib/api'

export interface Device {
  id: string
  device_name: string
  device_type?: string
  ip_address?: string
  hostname?: string
  is_reachable: string
  last_seen?: string
  os_type?: string
  discovered_at: string
}

export interface AgentSession {
  id: string
  session_type: string
  session_name?: string
  created_at: string
  last_activity: string
  is_active: boolean
}

export interface CommandHistory {
  id: string
  user_query: string
  command_type: string
  device_name?: string
  executed_command?: string
  agent_response?: string
  raw_output?: string
  execution_status: string
  timestamp: string
  execution_time_ms?: number
  response_time_ms?: number
}

export interface QueryRequest {
  question: string
  device_name?: string
  session_id?: string
}

export interface CommandRequest {
  command: string
  device_name?: string
  session_id?: string
}

export interface SessionCreateRequest {
  session_type: 'network' | 'general'
  session_name?: string
}

export interface QueryResponse {
  answer: string
  device_used?: string
  timestamp: string
  status: string
  command_id?: string
  response_time_ms?: number
}

export interface CommandResponse {
  output: string
  device_used?: string
  output_type: string
  status: string
  execution_time_ms?: number
  command_id?: string
}

class NetworkAgentService {
  /**
   * Check Network Agent service health
   */
  async checkHealth() {
    return apiClient.get('/network-agent/health')
  }

  /**
   * Send a natural language query to the AI agent
   */
  async queryAgent(request: QueryRequest) {
    return apiClient.post<QueryResponse>('/network-agent/query', request)
  }

  /**
   * Execute a direct command on a device
   */
  async executeCommand(request: CommandRequest) {
    return apiClient.post<CommandResponse>('/network-agent/command', request)
  }

  /**
   * Get user's agent sessions
   */
  async getSessions(limit: number = 20) {
    return apiClient.get<AgentSession[]>('/network-agent/sessions', { limit })
  }

  /**
   * Create a new agent session
   */
  async createSession(request: SessionCreateRequest) {
    return apiClient.post<AgentSession>('/network-agent/sessions', request)
  }

  /**
   * Get a specific session
   */
  async getSession(sessionId: string) {
    return apiClient.get<AgentSession>(`/network-agent/sessions/${sessionId}`)
  }

  /**
   * Get command history for a session
   */
  async getSessionHistory(sessionId: string, limit: number = 50) {
    return apiClient.get<CommandHistory[]>(
      `/network-agent/sessions/${sessionId}/history`,
      { limit }
    )
  }

  /**
   * Delete a session and its history
   */
  async deleteSession(sessionId: string) {
    return apiClient.delete(`/network-agent/sessions/${sessionId}`)
  }

  /**
   * Get discovered network devices
   */
  async getDevices() {
    return apiClient.get<Device[]>('/network-agent/devices')
  }

  /**
   * Discover devices and sync with database
   */
  async discoverDevices() {
    return apiClient.post('/network-agent/devices/discover')
  }

  /**
   * Test connectivity to all devices
   */
  async testConnectivity() {
    return apiClient.get('/network-agent/devices/connectivity')
  }
}

export const networkAgentService = new NetworkAgentService()