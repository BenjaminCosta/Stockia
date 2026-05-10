'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { StockiaLogo } from '@/components/stockia-logo'
import { useApp } from '@/lib/app-context'
import { cn } from '@/lib/utils'

export function ComercioTopHeader() {
  const { currentUser, getCartItemCount } = useApp()
  const comercio = currentUser as { storeName?: string } | null
  const storeName = comercio?.storeName || 'Mi comercio'
  const initials = storeName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const cartItemCount = getCartItemCount()

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <Link href="/comercio" className="flex items-center gap-2">
          <StockiaLogo size={36} />
          <span className="font-heading font-bold text-lg text-primary">Stockia</span>
        </Link>
      </div>
      <div className="flex items-center gap-3">
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
        <Link href="/comercio/cuenta">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs">
            {initials}
          </div>
        </Link>
      </div>
    </header>
  )
}
