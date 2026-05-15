'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/app-context'
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return <>{children}</>
}
