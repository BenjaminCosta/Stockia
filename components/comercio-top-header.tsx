'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell, Search, ShoppingCart, MapPin, ChevronDown,
  Heart, Flame, Sparkles, AlignJustify,
} from 'lucide-react'
import { StockiaLogo } from '@/components/stockia-logo'
import { useApp } from '@/lib/app-context'
import { cn } from '@/lib/utils'

const categoryBar = [
  { label: 'Todas las categorías', href: '/comercio/buscar', highlight: true, icon: AlignJustify },
  { label: 'Bebidas', href: '/comercio/buscar?categoria=Bebidas' },
  { label: 'Limpieza', href: '/comercio/buscar?categoria=Limpieza' },
  { label: 'Lácteos', href: '/comercio/buscar?categoria=Lácteos' },
  { label: 'Snacks', href: '/comercio/buscar?categoria=Snacks' },
  { label: 'Almacén', href: '/comercio/buscar?categoria=Almacén' },
  { label: 'Frescos', href: '/comercio/buscar?categoria=Frescos' },
  { label: 'Ofertas', href: '/comercio/buscar', icon: Flame, accent: true },
]

const distribuidorasBar = [
  { label: 'Distribuidoras', href: '/comercio/distribuidoras' },
  { label: 'Mis pedidos', href: '/comercio/pedidos' },
]

export function ComercioTopHeader() {
  const pathname = usePathname()
  const { currentUser, getCartItemCount, getCartTotal } = useApp()
  const comercio = currentUser as { storeName?: string } | null
  const storeName = comercio?.storeName || 'Mi comercio'
  const initials = storeName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const cartItemCount = getCartItemCount()
  const cartTotal = getCartTotal()

  return (
    <header className="sticky top-0 z-50 bg-[#080f2b] lg:bg-[#0B1A45] text-white">

      {/* Main header */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-16 flex items-center gap-4">

        {/* Logo */}
        <Link href="/comercio" className="shrink-0">
          <StockiaLogo size={28} variant="white" className="h-7" />
        </Link>

        {/* Location chip — desktop */}
        <button className="hidden lg:flex items-center gap-2 text-xs text-white/70 hover:text-white border-l border-white/10 pl-4 transition">
          <MapPin size={14} className="text-white/50" />
          <div className="text-left leading-tight">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Enviar a</div>
            <div className="font-semibold flex items-center gap-1">
              Buenos Aires <ChevronDown size={12} />
            </div>
          </div>
        </button>

        {/* Search — desktop */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              placeholder="Buscar productos, marcas o distribuidores"
              className="w-full pl-11 pr-28 h-11 rounded-2xl bg-white text-[#0B1A45] text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            <button className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-4 rounded-xl bg-[#0B1A45] text-white text-xs font-bold hover:bg-[#0B1A45]/90 transition-colors">
              Buscar
            </button>
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        {/* Right actions */}
        <div className="flex items-center gap-1 lg:gap-2 shrink-0">

          {/* User with name — desktop */}
          <Link href="/comercio/cuenta" className="hidden lg:flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/8 transition text-sm">
            <div className="h-8 w-8 rounded-full bg-[#C8FF00] flex items-center justify-center text-[#0B1A45] font-bold text-xs">
              {initials}
            </div>
            <div className="text-left leading-tight">
              <div className="text-[10px] text-white/40">Mi cuenta</div>
              <div className="font-semibold text-xs flex items-center gap-1">
                {storeName.length > 14 ? storeName.slice(0, 14) + '…' : storeName} <ChevronDown size={10} />
              </div>
            </div>
          </Link>

          {/* Favorites — desktop */}
          <button className="hidden lg:flex h-9 w-9 rounded-xl hover:bg-white/10 items-center justify-center text-white/70 hover:text-white transition" aria-label="Favoritos">
            <Heart size={18} />
          </button>

          {/* Bell */}
          <button className="relative h-9 w-9 rounded-xl hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition" aria-label="Notificaciones">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C8FF00] ring-2 ring-[#0B1A45]" />
          </button>

          {/* Cart */}
          <Link
            href="/comercio/carrito"
            className={cn(
              'relative flex h-9 lg:h-10 px-2.5 lg:px-3.5 rounded-xl bg-white/10 hover:bg-white/15 items-center justify-center gap-2 transition',
              cartItemCount > 0 && 'animate-cart-pulse'
            )}
            aria-label={`Carrito con ${cartItemCount} productos`}
          >
            <ShoppingCart size={18} />
            <span className="text-sm font-bold">
              ${cartTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4.5 min-w-4.5 px-1 rounded-full bg-[#C8FF00] text-[#0B1A45] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#0B1A45]">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Category bar — desktop only */}
      <div className="hidden lg:block bg-[#080f2b]/60 backdrop-blur border-t border-white/5">
        <div className="max-w-[1400px] mx-auto px-8 h-12 flex items-center gap-1 overflow-x-auto scrollbar-hide text-sm">
          {categoryBar.map((c) => {
            const Icon = c.icon
            const isActive = !c.accent && (pathname === c.href || (c.href.includes('?') && pathname + '?' === c.href.split('?')[0] + '?'))
            return (
              <Link
                key={c.label}
                href={c.href}
                className={cn(
                  'shrink-0 px-3 h-9 rounded-xl inline-flex items-center gap-1.5 font-medium transition whitespace-nowrap',
                  c.highlight
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : c.accent
                      ? 'text-[#C8FF00] hover:bg-[#C8FF00]/10'
                      : isActive
                        ? 'text-white bg-white/8'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                {Icon && <Icon size={14} />}
                {c.label}
              </Link>
            )
          })}

          <div className="w-px h-5 bg-white/10 mx-2 shrink-0" />

          {distribuidorasBar.map((c) => {
            const isActive = pathname === c.href || pathname.startsWith(c.href + '/')
            return (
              <Link
                key={c.label}
                href={c.href}
                className={cn(
                  'shrink-0 px-3 h-9 rounded-xl inline-flex items-center gap-1.5 font-medium transition whitespace-nowrap',
                  isActive
                    ? 'text-white bg-white/8'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                )}
              >
                {c.label}
              </Link>
            )
          })}

          <div className="ml-auto flex items-center gap-2 text-[11px] text-white/50 shrink-0">
            <Sparkles size={12} className="text-[#C8FF00]" />
            IA de reposición automática
          </div>
        </div>
      </div>
    </header>
  )
}
