'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/lib/app-context'

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
    return (
      <div className="min-h-screen bg-[#F4F5F7] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}
