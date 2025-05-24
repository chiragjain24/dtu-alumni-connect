import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/auth-client'

interface AuthGuardProps {
  children: ReactNode
  isProfileSetup?: boolean
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
} 