import React from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/LoginForm'
import { useAuth } from '@/contexts/AuthContext'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: ({ context }) => {
    // Redirect if already authenticated
    if (context.auth?.isAuthenticated) {
      throw new Response('Redirect', {
        status: 302,
        headers: {
          Location: '/dashboard',
        },
      })
    }
  },
})

function LoginPage() {
  const router = useRouter()

  const handleSuccess = () => {
    // Redirect to dashboard after successful login
    router.navigate({ to: '/dashboard' })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Network Engineer AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Intelligent assistant for network engineers
          </p>
        </div>
        
        <LoginForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}