'use client'

import { AppProvider } from '@/lib/app-context'
import { ComercioBottomNav } from '@/components/comercio-bottom-nav'
import { ComercioSidebar } from '@/components/comercio-sidebar'
import { ComercioTopHeader } from '@/components/comercio-top-header'

export default function ComercioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppProvider>
      <div className="min-h-screen bg-background">
        <ComercioSidebar />
        <ComercioTopHeader />
        <div className="lg:pl-64">
          <div className="pt-14 lg:pt-0 pb-20 lg:pb-0">
            {children}
          </div>
        </div>
        <ComercioBottomNav />
      </div>
    </AppProvider>
  )
}
