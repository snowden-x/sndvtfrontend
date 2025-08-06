import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import axios from 'axios'
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

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null
}

export interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshAuth: () => Promise<void>
  // Admin functions
  adminCreateUser: (email: string, username: string, password: string, fullName?: string) => Promise<User>
  adminListUsers: () => Promise<User[]>
  adminDeactivateUser: (userId: number) => Promise<void>
  adminActivateUser: (userId: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = 'http://localhost:8000/api'

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const USER_KEY = 'user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    accessToken: null,
    refreshToken: null,
  })

  // Set up axios interceptors
  useEffect(() => {
    // Request interceptor to add token
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (authState.accessToken) {
          config.headers.Authorization = `Bearer ${authState.accessToken}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor to handle token refresh
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            await refreshAuth()
            // Retry the original request with new token
            if (authState.accessToken) {
              originalRequest.headers.Authorization = `Bearer ${authState.accessToken}`
            }
            return axios(originalRequest)
          } catch (refreshError) {
            // Refresh failed, logout user
            logout()
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.request.eject(requestInterceptor)
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [authState.accessToken])

  // Load stored authentication data on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
        const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)

        if (storedAccessToken && storedRefreshToken && storedUser) {
          const user = JSON.parse(storedUser)
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
          })
          
          // Sync with API client
          apiClient.setAuthToken(storedAccessToken)

          // Verify token is still valid by fetching user info
          try {
            const response = await axios.get('/auth/me', {
              headers: { Authorization: `Bearer ${storedAccessToken}` }
            })
            // Update user data if successful
            const updatedUser = response.data
            setAuthState(prev => ({ ...prev, user: updatedUser }))
            localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
          } catch (error) {
            // Token invalid, try refresh
            await refreshAuth()
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        console.error('Error loading stored auth:', error)
        logout()
      }
    }

    loadStoredAuth()
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await axios.post('/auth/login', { email, password })
      const { access_token, refresh_token } = response.data

      // Get user info
      const userResponse = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      })
      const user = userResponse.data

      // Store tokens and user data
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: access_token,
        refreshToken: refresh_token,
      })
      
      // Sync with API client
      apiClient.setAuthToken(access_token)
    } catch (error) {
      console.error('Login error:', error)
      throw new Error('Login failed. Please check your credentials.')
    }
  }

  // Admin functions
  const adminCreateUser = async (email: string, username: string, password: string, fullName?: string): Promise<User> => {
    try {
      const response = await axios.post('/auth/admin/create-user', {
        email,
        username,
        password,
        full_name: fullName,
      })
      return response.data
    } catch (error) {
      console.error('Admin user creation error:', error)
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.detail || 'User creation failed')
      }
      throw new Error('User creation failed. Please try again.')
    }
  }

  const adminListUsers = async (): Promise<User[]> => {
    try {
      const response = await axios.get('/auth/admin/users')
      return response.data
    } catch (error) {
      console.error('Admin list users error:', error)
      throw new Error('Failed to fetch users')
    }
  }

  const adminDeactivateUser = async (userId: number): Promise<void> => {
    try {
      await axios.put(`/auth/admin/users/${userId}/deactivate`)
    } catch (error) {
      console.error('Admin deactivate user error:', error)
      throw new Error('Failed to deactivate user')
    }
  }

  const adminActivateUser = async (userId: number): Promise<void> => {
    try {
      await axios.put(`/auth/admin/users/${userId}/activate`)
    } catch (error) {
      console.error('Admin activate user error:', error)
      throw new Error('Failed to activate user')
    }
  }

  const logout = (): void => {
    // Clear stored data
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      accessToken: null,
      refreshToken: null,
    })
    
    // Clear API client token
    apiClient.setAuthToken('')
  }

  const refreshAuth = async (): Promise<void> => {
    try {
      const storedRefreshToken = authState.refreshToken || localStorage.getItem(REFRESH_TOKEN_KEY)
      
      if (!storedRefreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await axios.post('/auth/refresh', {
        refresh_token: storedRefreshToken
      })
      const { access_token, refresh_token } = response.data

      // Get updated user info
      const userResponse = await axios.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      })
      const user = userResponse.data

      // Store new tokens and user data
      localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
      localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        accessToken: access_token,
        refreshToken: refresh_token,
      })
      
      // Sync with API client
      apiClient.setAuthToken(access_token)
    } catch (error) {
      console.error('Token refresh error:', error)
      logout()
      throw error
    }
  }

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth,
    adminCreateUser,
    adminListUsers,
    adminDeactivateUser,
    adminActivateUser,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}