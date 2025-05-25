import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useSession } from '../lib/auth-client'
import Loader from './loader'

interface AuthGuardProps {
  children: ReactNode
  isProfileSetup?: boolean
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = useSession()

  if (isPending) return <Loader />

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
} 