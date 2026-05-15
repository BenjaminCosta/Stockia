'use client'

import { AppProvider } from '@/lib/app-context'
import { AuthGuard } from '@/components/auth-guard'
import { DistribuidoraSidebar } from '@/components/distribuidora-sidebar'
import { DistribuidoraBottomNav } from '@/components/distribuidora-bottom-nav'
import { DistribuidoraTopHeader } from '@/components/distribuidora-top-header'

export default function DistribuidoraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProvider>
      <AuthGuard requiredRole="distribuidora">
        <div className="min-h-screen bg-background">
          <DistribuidoraSidebar />
          <DistribuidoraTopHeader />
          <div className="lg:pl-64">
            <div className="pt-12 lg:pt-0 pb-20 lg:pb-0">
              {children}
            </div>
          </div>
          <DistribuidoraBottomNav />
        </div>
      </AuthGuard>
    </AppProvider>
  )
}
