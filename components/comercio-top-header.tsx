'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Search, ShoppingCart } from 'lucide-react'
import { StockiaLogo } from '@/components/stockia-logo'
import { useApp } from '@/lib/app-context'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/comercio', label: 'Categorías', exact: true },
  { href: '/comercio/distribuidoras', label: 'Distribuidores', exact: false },
  { href: '/comercio/buscar', label: 'Ofertas', exact: false },
  { href: '/comercio/pedidos', label: 'Mis pedidos', exact: false },
]

export function ComercioTopHeader() {
  const pathname = usePathname()
  const { currentUser, getCartItemCount } = useApp()
  const comercio = currentUser as { storeName?: string } | null
  const storeName = comercio?.storeName || 'Mi comercio'
  const initials = storeName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const cartItemCount = getCartItemCount()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:h-20 md:px-8">
        <Link href="/comercio" className="flex shrink-0 items-center gap-2.5">
          <StockiaLogo size={40} />
          <div className="leading-none">
            <span className="font-heading text-xl font-bold text-primary md:text-2xl">Stockia</span>
            <p className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground md:block">
              Portal Comercios
            </p>
          </div>
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar productos, marcas o distribuidores..."
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/40 focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'whitespace-nowrap border-b-2 pb-1 text-sm font-semibold transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            className="hidden h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-foreground transition-colors hover:bg-gray-100 md:flex"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
          </button>
          <Link
            href="/comercio/carrito"
            className={cn(
              'relative flex h-9 w-9 items-center justify-center rounded-full bg-gray-50 text-foreground transition-colors hover:bg-gray-100',
              cartItemCount > 0 && 'animate-cart-pulse'
            )}
            aria-label={`Carrito con ${cartItemCount} productos`}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                {cartItemCount}
              </span>
            )}
          </Link>
          <Link href="/comercio/cuenta" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white md:h-10 md:w-10">
              {initials}
            </div>
            <span className="hidden max-w-28 truncate text-sm font-semibold text-foreground xl:block">
              {storeName}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
