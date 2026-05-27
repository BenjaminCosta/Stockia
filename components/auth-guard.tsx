'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/app-context'
import { FullPageLoadingState } from '@/components/ui/LoadingState'
import type { UserRole } from '@/lib/types'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

/**
 * Client-side auth guard.
 * - Shows a full-screen spinner while Firebase restores the session.
 * - Redirects to /login if no authenticated user is found.
 * - Redirects to the correct dashboard if the user has the wrong role.
 */
export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { isAuthenticated, authLoading, userRole } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return

    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    if (requiredRole && userRole && userRole !== requiredRole) {
      // Wrong role — redirect to the correct area
      router.replace(userRole === 'distribuidora' ? '/distribuidora' : '/comercio')
    }
  }, [authLoading, isAuthenticated, userRole, requiredRole, router])

  if (authLoading) {
    return <FullPageLoadingState label="Validando tu sesión" />
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}
