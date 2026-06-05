'use client'

import Link from 'next/link'
import { Bell, ChevronRight, CircleUserRound, Grid2X2, Heart, ReceiptText, ShieldCheck, ShoppingCart, Shield, FileText, LifeBuoy, Building2 } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { InternalHeaderBackground } from '@/components/internal-header-background'

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

  const supportItems = [
    {
      href: '/comercio/notificaciones',
      label: 'Notificaciones',
      description: 'Actividad reciente y cambios de estado de tus pedidos',
      icon: Bell,
      iconBg: 'bg-[#F1FFD1] text-[#4A662E]',
    },
    {
      href: '/comercio/ayuda',
      label: 'Centro de ayuda',
      description: 'Respuestas rápidas para pedidos, acceso y operación',
      icon: LifeBuoy,
      iconBg: 'bg-blue-50 text-blue-600',
    },
    {
      href: '/comercio/contacto',
      label: 'Contacto',
      description: 'Canales directos para soporte y consultas operativas',
      icon: Shield,
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      href: '/comercio/como-funciona',
      label: 'Cómo funciona',
      description: 'Resumen del circuito completo de compra en StockIA',
      icon: FileText,
      iconBg: 'bg-purple-50 text-purple-600',
    },
    {
      href: '/comercio/empresa',
      label: 'Empresa',
      description: 'Qué hace StockIA y cómo pensamos la operación B2B',
      icon: Building2,
      iconBg: 'bg-gray-100 text-gray-700',
    },
    {
      href: '/comercio/terminos',
      label: 'Términos',
      description: 'Condiciones básicas de uso y funcionamiento',
      icon: FileText,
      iconBg: 'bg-red-50 text-red-500',
    },
    {
      href: '/comercio/privacidad',
      label: 'Privacidad',
      description: 'Cómo se tratan los datos del comercio en la plataforma',
      icon: Shield,
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F4F5F7]">
      <InternalHeaderBackground className="px-5 pt-7 pb-12 shadow-[0_18px_52px_rgba(8,15,43,0.18)] lg:hidden">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <ShieldCheck className="h-6 w-6 text-[#C8FF00]" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C8FF00]/60">Comercio</p>
            <h1 className="font-heading text-xl font-bold leading-tight tracking-tight text-white">Más opciones</h1>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">Accesos rápidos</p>
          <p className="text-sm font-semibold text-white/90">Gestión de tu compra</p>
        </div>
      </InternalHeaderBackground>

      <div className="relative z-10 px-4 -mt-7 pb-8 lg:mt-0 lg:mx-auto lg:max-w-2xl lg:pt-8">
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

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Soporte y legales</p>
          </div>
          {supportItems.map((item, i) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-4 transition-colors hover:bg-gray-50 active:bg-gray-100${i < supportItems.length - 1 ? ' border-b border-gray-50' : ''}`}
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
      </div>
    </div>
  )
}
