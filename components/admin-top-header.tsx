'use client'

import Link from 'next/link'
import { ShieldCheck, Bell } from 'lucide-react'
import { StockiaLogo } from '@/components/stockia-logo'

export function AdminTopHeader() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-12 bg-[#080f2b] z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-2.5">
        <Link href="/admin" className="shrink-0">
          <StockiaLogo size={28} variant="white" className="h-7" />
        </Link>
        <div className="flex items-center gap-1 bg-[rgba(200,255,0,0.12)] px-2 py-0.5 rounded-md">
          <ShieldCheck className="h-3 w-3 text-[#C8FF00]" />
          <span className="text-[10px] font-bold text-[#C8FF00] uppercase tracking-wider">Admin</span>
        </div>
      </div>
      <button
        className="relative h-8 w-8 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition"
        aria-label="Notificaciones"
      >
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C8FF00] ring-2 ring-[#080f2b]" />
      </button>
    </header>
  )
}
