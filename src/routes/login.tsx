
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { LoginForm } from '@/components/auth/LoginForm'

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: () => {
    // Authentication check will be handled by the component
  },
})

function LoginPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.navigate({ to: '/dashboard' })
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Brand / Hero side */}
      <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-primary/10 to-accent">
        <div className="text-sm font-medium text-primary">SNDVT Monitor</div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Network Engineer AI Assistant</h1>
          <p className="text-muted-foreground max-w-md">
            Troubleshoot faster, manage devices, and stay ahead of outages with predictive alerts and an AI-assisted workflow.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} SNDVT</div>
      </div>

      {/* Auth form side */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:hidden">
            <h1 className="text-2xl font-bold">SNDVT Monitor</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>
          <LoginForm onSuccess={handleSuccess} />
        </div>
      </div>
    </div>
  )
}