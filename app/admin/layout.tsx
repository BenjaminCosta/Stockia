'use client'

import { AppProvider } from '@/lib/app-context'
import { AdminGuard } from '@/components/admin-guard'
import { AdminSidebar } from '@/components/admin-sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AdminGuard>
        <div className="min-h-screen bg-[#F4F5F7] flex">
          <AdminSidebar />
          <main className="flex-1 md:ml-64 min-h-screen">
            {children}
          </main>
        </div>
      </AdminGuard>
    </AppProvider>
  )
}
