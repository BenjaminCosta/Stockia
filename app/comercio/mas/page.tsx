'use client'

import Link from 'next/link'
import { ChevronRight, CircleUserRound, Grid2X2, Heart, ReceiptText, ShieldCheck, ShoppingCart } from 'lucide-react'
import { useApp } from '@/lib/app-context'

export default function ComercioMasPage() {
  const { wishlist } = useApp()

  const moreItems = [
    {
      href: '/comercio/cuenta',
      label: 'Mi cuenta',
      description: 'Datos del comercio y preferencias',
      icon: CircleUserRound,
      iconBg: 'bg-blue-50 text-blue-600',
      badge: null,
    },
    {
      href: '/comercio/wishlist',
      label: 'Mi lista de deseos',
      description: 'Productos guardados para comprar después',
      icon: Heart,
      iconBg: 'bg-[#F1FFD1] text-[#4A662E]',
      badge: wishlist.length > 0 ? wishlist.length : null,
    },
    {
      href: '/comercio/carrito',
      label: 'Carrito',
      description: 'Productos seleccionados para comprar',
      icon: ShoppingCart,
      iconBg: 'bg-amber-50 text-amber-600',
      badge: null,
    },
    {
      href: '/comercio/buscar',
      label: 'Categorías',
      description: 'Explorar productos por rubro',
      icon: Grid2X2,
      iconBg: 'bg-purple-50 text-purple-600',
      badge: null,
    },
    {
      href: '/comercio/pedidos',
      label: 'Mis pedidos',
      description: 'Historial y seguimiento de compras',
      icon: ReceiptText,
      iconBg: 'bg-red-50 text-red-500',
      badge: null,
    },
  ]

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <div className="bg-[#0B1A45] px-5 pt-6 pb-10 lg:hidden">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-11 w-11 rounded-xl bg-[rgba(200,255,0,0.12)] flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6 text-[#C8FF00]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-[#C8FF00] uppercase tracking-widest">Comercio</p>
            <h1 className="text-lg font-bold text-white leading-tight">Más opciones</h1>
          </div>
        </div>
        <div className="bg-white/8 border border-white/5 rounded-xl px-4 py-3">
          <p className="text-[11px] text-white/40 font-medium uppercase tracking-wider mb-0.5">Accesos rápidos</p>
          <p className="text-sm font-semibold text-white">Gestión de tu compra</p>
        </div>
      </div>

      <div className="px-4 -mt-4 pb-8 lg:mt-0 lg:mx-auto lg:max-w-2xl lg:pt-8">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Accesos</p>
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
                {item.badge != null ? (
                  <span className="h-5 min-w-5 px-1.5 rounded-full bg-[#C8FF00] text-[#0B1A45] text-[10px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" strokeWidth={1.75} />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
