'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, CircleUserRound, LogOut, MapPinned, ShieldCheck, Star } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { InternalHeaderBackground } from '@/components/internal-header-background'

const moreItems = [
  {
    href: '/distribuidora/zonas',
    label: 'Zonas de entrega',
    description: 'Áreas, cobertura y condiciones',
    icon: MapPinned,
    iconBg: 'bg-[#F1FFD1] text-[#4A662E]',
  },
  {
    href: '/distribuidora/resenas',
    label: 'Reseñas',
    description: 'Opiniones y reputación comercial',
    icon: Star,
    iconBg: 'bg-[#F1FFD1] text-[#89B317]',
  },
  {
    href: '/distribuidora/perfil',
    label: 'Cuenta',
    description: 'Datos de empresa y preferencias',
    icon: CircleUserRound,
    iconBg: 'bg-[#0B1A45]/8 text-[#0B1A45]',
  },
]

export default function DistribuidoraMasPage() {
  const { logout } = useApp()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <InternalHeaderBackground className="px-5 pt-7 pb-12 shadow-[0_18px_52px_rgba(8,15,43,0.18)] lg:hidden">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <ShieldCheck className="h-6 w-6 text-[#C8FF00]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8FF00]/60">Panel Distribuidora</p>
            <h1 className="font-heading text-xl font-bold leading-tight tracking-tight text-white">Más opciones</h1>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Cuenta activa</p>
          <p className="text-sm font-semibold text-white/90">Gestión de la distribuidora</p>
        </div>
      </InternalHeaderBackground>

      <div className="relative z-10 px-4 -mt-7 pb-8 lg:mt-0 lg:mx-auto lg:max-w-2xl lg:pt-8">
        <div className="overflow-hidden rounded-2xl border border-[#DFE1E8]/80 bg-white shadow-[0_1px_3px_rgba(11,26,69,0.05)]">
          <div className="border-b border-[#DFE1E8]/60 px-4 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Gestión</p>
          </div>
          {moreItems.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-[#F7F8FA] active:bg-[#EFF0F3]${i < moreItems.length - 1 ? ' border-b border-[#DFE1E8]/60' : ''}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}>
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="mt-0.5 text-xs leading-snug text-gray-400">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" strokeWidth={1.75} />
              </Link>
            )
          })}
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-[#DFE1E8]/80 bg-white shadow-[0_1px_3px_rgba(11,26,69,0.05)]">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-4 px-4 py-4 text-left transition-colors hover:bg-red-50 active:bg-red-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <LogOut className="h-5 w-5 text-red-600" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-600">Cerrar sesión</p>
              <p className="mt-0.5 text-xs text-gray-400">Salir del panel de distribuidora</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
