import { createFileRoute } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/')({
  component: IndexRedirect,
  beforeLoad: () => {
    // This will be handled in the component since we need to check auth state
  },
})

function IndexRedirect() {
  const { isAuthenticated, isLoading } = useAuth()
  
  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }
  
  // Redirect based on authentication status using router navigation
  if (isAuthenticated) {
    window.location.assign('/dashboard')
  } else {
    window.location.assign('/login')
  }
  
  return null
} 