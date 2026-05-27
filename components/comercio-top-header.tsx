'use client'

import { useEffect, useState, useMemo, type FormEvent } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Bell, Search, ShoppingCart, MapPin, ChevronDown, ChevronRight,
  Heart, Flame, Sparkles, AlignJustify, Package, ShieldAlert, Star, Truck, X,
} from 'lucide-react'
import { StockiaLogo } from '@/components/stockia-logo'
import { StatusBadge } from '@/components/status-badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useApp } from '@/lib/app-context'
import { Comercio, Order } from '@/lib/types'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/mock-data'

// Grupos de categorías curados para el header (no necesariamente 1:1 con la BD)
const categoryBar = [
  { label: 'Todas las categorías', href: '/comercio/buscar', highlight: true, icon: AlignJustify },
  { label: 'Bebidas',   href: '/comercio/buscar?categoria=Bebidas' },
  { label: 'Limpieza',  href: '/comercio/buscar?categoria=Limpieza' },
  { label: 'Lácteos',   href: '/comercio/buscar?categoria=Lácteos' },
  { label: 'Snacks',    href: '/comercio/buscar?categoria=Snacks' },
  { label: 'Almacén',   href: '/comercio/buscar?categoria=Almacén' },
  { label: 'Frescos',   href: '/comercio/buscar?categoria=Frescos' },
  { label: 'Golosinas', href: '/comercio/buscar?categoria=Golosinas%20y%20Kiosco' },
  { label: 'Ofertas',   href: '/comercio/buscar?oferta=1', icon: Flame, accent: true },
]

const distribuidorasBar = [
  { label: 'Distribuidoras', href: '/comercio/distribuidoras' },
  { label: 'Mis pedidos', href: '/comercio/pedidos' },
]

const previewToneStyles = {
  neutral: 'border-slate-200 bg-white',
  positive: 'border-lime-200 bg-white',
  warning: 'border-amber-200 bg-white',
  critical: 'border-red-200 bg-white',
}

function buildNotification(order: Order) {
  const firestoreStatus = order.firestoreStatus ?? (
    order.status === 'entregado' ? 'delivered' :
    order.status === 'en_preparacion' ? 'preparing' :
    order.status === 'pagado' ? 'confirmed' :
    'pending_confirmation'
  )

  if (firestoreStatus === 'cancelled') {
    return {
      title: 'Pedido cancelado',
      description: `${order.distribuidoraName} cerró la operación como cancelada.`,
      icon: ShieldAlert,
      tone: 'critical' as const,
    }
  }

  if (firestoreStatus === 'delivered') {
    return {
      title: 'Pedido entregado',
      description: `${order.distribuidoraName} marcó el pedido como entregado.`,
      icon: Star,
      tone: 'positive' as const,
    }
  }

  if (firestoreStatus === 'ready_or_on_the_way') {
    return {
      title: 'Pedido en camino',
      description: `${order.distribuidoraName} ya está coordinando la entrega.`,
      icon: Truck,
      tone: 'positive' as const,
    }
  }

  if (firestoreStatus === 'confirmed') {
    return {
      title: 'Pedido confirmado',
      description: `${order.distribuidoraName} aceptó tu pedido.`,
      icon: Package,
      tone: 'positive' as const,
    }
  }

  if (firestoreStatus === 'preparing') {
    return {
      title: 'Pedido en preparación',
      description: `${order.distribuidoraName} está armando tu compra.`,
      icon: Package,
      tone: 'neutral' as const,
    }
  }

  return {
    title: 'Pedido enviado',
    description: `Tu pedido quedó pendiente de confirmación por parte de ${order.distribuidoraName}.`,
    icon: Bell,
    tone: 'warning' as const,
  }
}

export function ComercioTopHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('q') ?? ''
  const activeCategoria = searchParams.get('categoria')
  const activeOferta = searchParams.get('oferta') === '1'
  const [searchQuery, setSearchQuery] = useState(currentQuery)
  const { currentUser, getCartItemCount, getCartTotal, wishlist, commerceOrders } = useApp()
  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const storeName = comercio?.storeName || 'Mi comercio'
  const locationCity = comercio?.location?.city || 'Buenos Aires'
  const initials = storeName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const cartItemCount = getCartItemCount()
  const cartTotal = getCartTotal()
  const wishlistCount = wishlist.length
  const recentNotifications = useMemo(() => [...commerceOrders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3), [commerceOrders])

  useEffect(() => {
    setSearchQuery(currentQuery)
  }, [currentQuery])

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()

    if (query) {
      router.push(`/comercio/buscar?q=${encodeURIComponent(query)}`)
      return
    }

    router.push('/comercio/buscar')
  }

  const clearSearch = () => {
    setSearchQuery('')
    if (pathname === '/comercio/buscar' && currentQuery) {
      router.push('/comercio/buscar')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-sidebar lg:bg-[#0B1A45] text-white">

      {/* Main header */}
      <div className="max-w-350 mx-auto px-4 lg:px-8 h-12 lg:h-16 flex items-center gap-4">

        {/* Logo */}
        <Link href="/comercio" className="shrink-0">
          <StockiaLogo variant="white" className="h-7 w-auto" />
        </Link>

        {/* Location chip — desktop */}
        <Link href="/comercio/cuenta" className="hidden lg:flex items-center gap-2 text-xs text-white/70 hover:text-white border-l border-white/10 pl-4 transition-colors duration-150">
          <MapPin size={14} className="text-white/50" />
          <div className="text-left leading-tight">
            <div className="text-[10px] text-white/40 uppercase tracking-wider">Enviar a</div>
            <div className="font-semibold flex items-center gap-1">
              {locationCity} <ChevronDown size={12}/>
            </div>
          </div>
        </Link>

        {/* Search — desktop */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <form className="relative" role="search" onSubmit={handleSearchSubmit}>
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7A839C] pointer-events-none" />
            <input
              type="text"
              inputMode="search"
              placeholder="Buscar productos, marcas o distribuidores"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="stockia-header-search-field h-11 w-full appearance-none rounded-2xl bg-white pl-11 pr-32 text-sm font-medium text-[#0B1A45] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_22px_rgba(8,15,43,0.16)] placeholder:text-gray-400 transition-[box-shadow,background-color] duration-150 focus:bg-white focus:outline-none focus:ring-2 focus:ring-white/45"
              aria-label="Buscar productos, marcas o distribuidores"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-[5.75rem] top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#7A839C] transition-colors hover:bg-gray-100 hover:text-[#0B1A45]"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-xl bg-[#0B1A45] px-4 text-xs font-bold text-white transition-[transform,background-color] duration-150 hover:bg-[#0B1A45]/90 active:scale-[0.97]"
            >
              Buscar
            </button>
          </form>
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
          <Link
            href="/comercio/wishlist"
            className="relative hidden lg:flex h-9 w-9 rounded-xl hover:bg-white/10 items-center justify-center transition group"
            aria-label="Lista de deseos"
          >
            <Heart
              size={18}
              className={cn(
                'transition-all duration-200',
                wishlistCount > 0
                  ? 'fill-[#C8FF00] stroke-[#C8FF00]'
                  : 'text-white/70 group-hover:text-white'
              )}
            />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4.5 min-w-4.5 px-1 rounded-full bg-[#C8FF00] text-[#0B1A45] text-[10px] font-bold flex items-center justify-center ring-2 ring-[#0B1A45]">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Bell — desktop preview */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative hidden h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white lg:flex"
                aria-label="Notificaciones"
              >
                <Bell size={18} />
                {recentNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C8FF00] ring-2 ring-[#0B1A45]" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              side="bottom"
              sideOffset={12}
              className="hidden w-96 overflow-hidden rounded-[26px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-0 text-slate-950 shadow-[0_22px_64px_rgba(15,23,42,0.16)] lg:block"
            >
              <div className="relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-22 bg-[radial-gradient(circle_at_top_right,rgba(200,255,0,0.22),transparent_52%),linear-gradient(180deg,rgba(241,245,249,0.96)_0%,rgba(255,255,255,0)_100%)]" />
                <div className="relative border-b border-slate-200 px-4 pb-4 pt-4.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#6d7c31]">Centro rapido</p>
                  <h3 className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-[#0B1A45]">Notificaciones recientes</h3>
                  <p className="mt-1.5 max-w-md text-[13px] leading-5 text-slate-600">
                    Mirá lo último sin salir de la página. Si necesitás más contexto, entrá a la vista completa.
                  </p>
                </div>

                <div className="relative space-y-2.5 px-3 py-3">
                  {recentNotifications.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-50 text-[#7ea105]">
                        <Bell className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3 font-heading text-lg font-bold text-[#0B1A45]">Todavía no hay actividad</h3>
                      <p className="mx-auto mt-2 max-w-xs text-[13px] leading-5 text-slate-600">
                        Cuando entren nuevos movimientos de pedidos, los vas a ver primero acá.
                      </p>
                    </div>
                  ) : (
                    recentNotifications.map((order) => {
                      const notification = buildNotification(order)
                      const Icon = notification.icon

                      return (
                        <Link
                          key={order.id}
                          href={`/comercio/pedidos/${order.id}`}
                          className={cn(
                            'group flex items-start gap-3 rounded-3xl border px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white',
                            previewToneStyles[notification.tone],
                          )}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B1A45] text-white shadow-[0_8px_18px_rgba(11,26,69,0.14)]">
                            <Icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-[#0B1A45]">{notification.title}</p>
                              <StatusBadge status={order.firestoreStatus ?? order.status} />
                            </div>
                            <p className="mt-1 text-[13px] leading-5 text-slate-600">{notification.description}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                              <span className="font-semibold text-[#0B1A45]">{order.orderNumber}</span>
                              <span>{new Date(order.updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                              <span>{order.distribuidoraName}</span>
                            </div>
                          </div>
                          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#0B1A45]" />
                        </Link>
                      )
                    })
                  )}
                </div>

                <div className="relative flex items-center justify-between gap-3 border-t border-slate-200 bg-white/80 px-3 py-3.5">
                  <p className="text-[13px] text-slate-500">{recentNotifications.length > 0 ? `${recentNotifications.length} alertas recientes` : 'Sin alertas nuevas'}</p>
                  <Link
                    href="/comercio/notificaciones"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B1A45] px-3.5 py-2 text-[13px] font-bold text-white transition-[transform,background-color] duration-150 hover:scale-[1.01] hover:bg-[#142657]"
                  >
                    Mirar todo
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Bell — mobile */}
          <Link href="/comercio/notificaciones" className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white active:scale-95 lg:hidden" aria-label="Notificaciones">
            <Bell size={18} />
            {recentNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#C8FF00] ring-2 ring-[#0B1A45]" />
            )}
          </Link>

          {/* Wishlist — mobile */}
          <Link
            href="/comercio/wishlist"
            className="relative lg:hidden h-9 w-9 rounded-xl hover:bg-white/10 flex items-center justify-center transition"
            aria-label="Lista de deseos"
          >
            <Heart
              size={18}
              className={cn(
                'transition-all duration-200',
                wishlistCount > 0
                  ? 'fill-[#C8FF00] stroke-[#C8FF00]'
                  : 'text-white/70'
              )}
            />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-[#C8FF00] text-[#0B1A45] text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0B1A45]">
                {wishlistCount}
              </span>
            )}
          </Link>

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
              {formatCurrency(cartTotal)}
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
      <div className="hidden lg:block bg-[#080f2b]/70 backdrop-blur-sm border-t border-white/5">
        <div className="max-w-350 mx-auto px-8 h-12 flex items-center gap-1 overflow-x-auto scrollbar-hide text-sm">
          {categoryBar.map((c) => {
            const Icon = c.icon
            const catParam = c.href.includes('?categoria=')
              ? decodeURIComponent(c.href.split('?categoria=')[1])
              : null
            const isOfertaItem = c.href.includes('?oferta=1')
            const isActive = isOfertaItem
              ? activeOferta && pathname === '/comercio/buscar'
              : !c.accent && (
                  catParam
                    ? pathname === '/comercio/buscar' && activeCategoria === catParam
                    : pathname === '/comercio/buscar' && !activeCategoria && !activeOferta && c.highlight
                )
            return (
              <Link
                key={c.label}
                href={c.href}
                className={cn(
                  'shrink-0 px-3 h-9 rounded-xl inline-flex items-center gap-1.5 font-medium whitespace-nowrap',
                  'transition-colors duration-150',
                  isOfertaItem
                    ? isActive
                      ? 'bg-[#C8FF00]/15 text-[#C8FF00]'
                      : 'text-[#C8FF00] hover:bg-[#C8FF00]/10'
                    : c.highlight
                      ? 'bg-white/10 text-white hover:bg-white/15 active:bg-white/20'
                      : isActive
                        ? 'text-white bg-white/10'
                        : 'text-white/60 hover:text-white hover:bg-white/6'
                )}
              >
                {Icon && <Icon size={14} />}
                {c.label}
              </Link>
            )
          })}

          <div className="ml-auto flex items-center gap-1 shrink-0">
            <div className="w-px h-5 bg-white/10 mx-2" />
            {distribuidorasBar.map((c) => {
              const isActive = pathname === c.href || pathname.startsWith(c.href + '/')
              return (
                <Link
                  key={c.label}
                  href={c.href}
                  className={cn(
                    'shrink-0 px-3 h-9 rounded-xl inline-flex items-center gap-1.5 font-medium whitespace-nowrap',
                    'transition-colors duration-150',
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-white/60 hover:text-white hover:bg-white/6'
                  )}
                >
                  {c.label}
                </Link>
              )
            })}
            <div className="w-px h-5 bg-white/10 mx-2" />
            <span className="flex items-center gap-2 text-[11px] text-white/50">
              <Sparkles size={12} className="text-[#C8FF00]" />
              IA de reposición automática
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
