'use client'

import Link from 'next/link'
import { StockiaLogo } from '@/components/stockia-logo'
import { useApp } from '@/lib/app-context'

export function DistribuidoraTopHeader() {
  const { currentUser } = useApp()
  const distribuidora = currentUser as { companyName?: string } | null
  const companyName = distribuidora?.companyName || 'Mi distribuidora'
  const initials = companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Link href="/distribuidora" className="flex items-center gap-2">
          <StockiaLogo size={36} />
          <span className="font-heading font-bold text-lg text-primary">Stockia</span>
        </Link>
      </div>
      <Link href="/distribuidora/perfil">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs">
          {initials}
        </div>
      </Link>
    </header>
  )
}
