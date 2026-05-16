'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, CircleUserRound, LogOut, MapPinned, ShieldCheck, Star } from 'lucide-react'
import { useApp } from '@/lib/app-context'

const moreItems = [
  {
    href: '/distribuidora/zonas',
    label: 'Zonas de entrega',
    description: 'Áreas, cobertura y condiciones',
    icon: MapPinned,
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/distribuidora/resenas',
    label: 'Reseñas',
    description: 'Opiniones y reputación comercial',
    icon: Star,
    iconBg: 'bg-purple-50 text-purple-600',
  },
  {
    href: '/distribuidora/perfil',
    label: 'Cuenta',
    description: 'Datos de empresa y preferencias',
    icon: CircleUserRound,
    iconBg: 'bg-blue-50 text-blue-600',
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
      <div className="bg-[#0B1A45] px-5 pt-6 pb-10 lg:hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-xl bg-[rgba(200,255,0,0.12)] flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-[#C8FF00]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#C8FF00] uppercase tracking-widest">Panel Distribuidora</p>
            <h1 className="text-lg font-bold text-white leading-tight">Más opciones</h1>
          </div>
        </div>
        <div className="bg-white/8 border border-white/5 rounded-xl px-4 py-3">
          <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider mb-0.5">Cuenta activa</p>
          <p className="text-sm font-semibold text-white">Gestión de la distribuidora</p>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-8 lg:mt-0 lg:mx-auto lg:max-w-2xl lg:pt-8">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Gestión</p>
          </div>
          {moreItems.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100${i < moreItems.length - 1 ? ' border-b border-gray-50' : ''}`}
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

        <div className="mt-3 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
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
