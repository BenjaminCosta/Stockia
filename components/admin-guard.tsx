'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/app-context'
import { FullPageLoadingState } from '@/components/ui/LoadingState'

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { authLoading, isAuthenticated, userRole } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { router.replace('/login'); return }
    if (userRole !== 'admin') {
      const dest = userRole === 'distribuidora' ? '/distribuidora' : '/comercio'
      router.replace(dest)
    }
  }, [authLoading, isAuthenticated, userRole, router])

  if (authLoading || !isAuthenticated || userRole !== 'admin') {
    return <FullPageLoadingState label="Preparando panel" />
  }

  return <>{children}</>
}
