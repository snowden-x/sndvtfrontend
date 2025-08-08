/**
 * Users API service
 */

import { apiClient } from '@/lib/api'

export interface User {
  id: number
  email: string
  username: string
  full_name?: string
  is_active: boolean
  is_superuser: boolean
  created_at: string
  last_login?: string
}

class UsersService {
  private userCache = new Map<number, User>()

  /**
   * Get current user information
   */
  async getCurrentUser() {
    return apiClient.get<User>('/auth/me')
  }

  /**
   * Get user by ID (cached)
   */
  async getUserById(userId: number): Promise<User | null> {
    // Check cache first
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!
    }

    try {
      const result = await apiClient.get<User>(`/auth/admin/users/${userId}`)
      if (result.data) {
        // Cache the user
        this.userCache.set(userId, result.data)
        return result.data
      }
    } catch (error) {
      console.warn(`Failed to fetch user ${userId}:`, error)
    }

    return null
  }

  /**
   * Get multiple users by IDs (batch fetch with caching)
   */
  async getUsersByIds(userIds: number[]): Promise<Map<number, User>> {
    const users = new Map<number, User>()
    const uncachedIds: number[] = []

    // Check cache first
    for (const id of userIds) {
      if (this.userCache.has(id)) {
        users.set(id, this.userCache.get(id)!)
      } else {
        uncachedIds.push(id)
      }
    }

    // Fetch uncached users
    for (const id of uncachedIds) {
      const user = await this.getUserById(id)
      if (user) {
        users.set(id, user)
      }
    }

    return users
  }

  /**
   * Get display name for user
   */
  getUserDisplayName(user: User): string {
    return user.full_name || user.username || user.email
  }

  /**
   * Clear user cache
   */
  clearCache() {
    this.userCache.clear()
  }
}

export const usersService = new UsersService()
