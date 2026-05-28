'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Bell } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { StockiaLogo } from '@/components/stockia-logo'

export function DistribuidoraTopHeader() {
  const { currentUser } = useApp()
  const distribuidora = currentUser as { companyName?: string } | null
  const companyName = distribuidora?.companyName || 'Mi distribuidora'
  const initials = useMemo(
    () => companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase(),
    [companyName]
  )

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-10 bg-sidebar z-50 flex items-center justify-between px-4">
      {/* Logo */}
      <Link href="/distribuidora" className="shrink-0">
        <StockiaLogo variant="white" className="h-5.5 w-auto" />
      </Link>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Bell → pedidos */}
        <Link
          href="/distribuidora/pedidos"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white active:scale-95"
          aria-label="Pedidos"
        >
          <Bell size={18} />
        </Link>

        {/* Avatar → perfil */}
        <Link
          href="/distribuidora/perfil"
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10 transition-colors duration-150 active:scale-95"
          aria-label="Mi perfil"
        >
          <div className="h-7 w-7 rounded-full bg-[#C8FF00] flex items-center justify-center text-[#0B1A45] font-bold text-[10px]">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  )
}
