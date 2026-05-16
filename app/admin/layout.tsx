'use client'

import { AppProvider } from '@/lib/app-context'
import { AdminGuard } from '@/components/admin-guard'
import { AdminSidebar } from '@/components/admin-sidebar'
import { AdminTopHeader } from '@/components/admin-top-header'
import { AdminBottomNav } from '@/components/admin-bottom-nav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AdminGuard>
        <div className="min-h-screen bg-[#F4F5F7] flex">
          <AdminTopHeader />
          <AdminSidebar />
          <main className="flex-1 md:ml-64 min-h-screen pt-12 md:pt-0 pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
            {children}
          </main>
          <AdminBottomNav />
        </div>
      </AdminGuard>
    </AppProvider>
  )
}
