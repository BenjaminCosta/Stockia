'use client'

import { AppProvider } from '@/lib/app-context'
import { AuthGuard } from '@/components/auth-guard'
import { ComercioBottomNav } from '@/components/comercio-bottom-nav'
import { ComercioTopHeader } from '@/components/comercio-top-header'
import { ComercioFooter } from '@/components/comercio-footer'

export default function ComercioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProvider>
      <AuthGuard requiredRole="comercio">
        <div className="min-h-screen bg-background">
          <ComercioTopHeader />
          <div className="pb-20 lg:pb-0">
            {children}
          </div>
          <ComercioFooter />
          <ComercioBottomNav />
        </div>
      </AuthGuard>
    </AppProvider>
  )
}
