'use client'

import Link from 'next/link'
import { useApp } from '@/lib/app-context'

import { StockiaLogo } from '@/components/stockia-logo'

export function DistribuidoraTopHeader() {
  const { currentUser } = useApp()
  const distribuidora = currentUser as { companyName?: string } | null
  const companyName = distribuidora?.companyName || 'Mi distribuidora'
  const initials = companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-12 bg-[#080f2b] z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <Link href="/comercio" className="shrink-0">
          <StockiaLogo size={28} variant="white" className="h-7" />
        </Link>
      </div>
      <Link href="/distribuidora/perfil">
        <div className="h-8 w-8 rounded-full bg-[#C8FF00] flex items-center justify-center text-[#0B1A45] font-bold text-xs">
              {initials}
            </div>
      </Link>
    </header>
  )
}
