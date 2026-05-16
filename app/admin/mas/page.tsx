'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Receipt, Tag, Star, LogOut, ChevronRight, ShieldCheck } from 'lucide-react'
import { useApp } from '@/lib/app-context'

const moreItems = [
  {
    href: '/admin/comisiones',
    label: 'Comisiones',
    description: 'Gestionar pagos y estados de comisiones',
    icon: Receipt,
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    href: '/admin/categorias',
    label: 'Categorías',
    description: 'Rubros y categorías del catálogo',
    icon: Tag,
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    href: '/admin/ratings',
    label: 'Reseñas',
    description: 'Moderar reseñas y feedback de la plataforma',
    icon: Star,
    iconBg: 'bg-purple-50 text-purple-600',
  },
]

export default function AdminMasPage() {
  const { logout } = useApp()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#F4F5F7]">

      {/* Dark hero header */}
      <div className="bg-[#0B1A45] px-5 pt-6 pb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-xl bg-[rgba(200,255,0,0.12)] flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-[#C8FF00]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#C8FF00] uppercase tracking-widest">Panel Admin</p>
            <p className="text-lg font-bold text-white leading-tight">StockIA Admin</p>
          </div>
        </div>
        <div className="bg-white/8 border border-white/5 rounded-xl px-4 py-3">
          <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider mb-0.5">Cuenta activa</p>
          <p className="text-sm font-semibold text-white">admin@stockia.app</p>
        </div>
      </div>

      {/* Cards pulled over the header */}
      <div className="px-4 -mt-4 pb-8 space-y-3">

        {/* Navigation items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gestión</p>
          </div>
          {moreItems.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors${i < moreItems.length - 1 ? ' border-b border-gray-50' : ''}`}
              >
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-snug">{item.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </Link>
            )
          })}
        </div>

        {/* Logout */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="h-5 w-5 text-red-500" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-red-500">Cerrar sesión</p>
              <p className="text-xs text-gray-400 mt-0.5">Salir del panel de administración</p>
            </div>
          </button>
        </div>

      </div>
    </div>
  )
}
