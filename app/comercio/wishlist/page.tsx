'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Heart, ArrowLeft, Trash2, ShoppingCart } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { ProductCard } from '@/components/product-card'
import { Product } from '@/lib/types'

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, clearCart, addToCart } = useApp()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [justAdded, setJustAdded] = useState<Record<string, boolean>>({})

  const getQty = (id: string) => quantities[id] ?? 1

  const handleQtyChange = (id: string, v: number) => {
    setQuantities(prev => ({ ...prev, [id]: v }))
  }

  const handleAddToCart = (product: Product) => {
    const distName = product.distribuidoraId // fallback — real name not stored in product
    addToCart(product, distName, getQty(product.id))
    setJustAdded(prev => ({ ...prev, [product.id]: true }))
    setTimeout(() => setJustAdded(prev => ({ ...prev, [product.id]: false })), 2000)
  }

  /* ── Empty state ─────────────────────────────────────────────────────────── */
  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
        <div className="max-w-350 mx-auto px-4 py-6 md:px-8 md:py-8">
          {/* Header */}
          <header className="mb-8 flex items-center gap-4">
            <Link
              href="/comercio"
              className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-[#DFE1E8] flex items-center justify-center text-[#0B1A45] hover:bg-gray-50 transition-colors active:scale-95 shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Guardados
              </p>
              <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-[#0B1A45] md:text-3xl">
                Mi lista de deseos
              </h1>
            </div>
          </header>

          {/* Empty */}
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center md:py-24">
            <div className="relative mb-6">
              <div className="h-24 w-24 rounded-full bg-[#F1FFD1] flex items-center justify-center">
                <Heart className="h-12 w-12 text-[#DFE1E8]" strokeWidth={1.5} />
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-[#C8FF00] flex items-center justify-center text-[#0B1A45]">
                <span className="text-sm font-bold">0</span>
              </div>
            </div>
            <h2 className="text-lg font-bold text-[#0B1A45] mb-2">Todavía no guardaste nada</h2>
            <p className="text-sm text-[#7A839C] max-w-xs leading-relaxed mb-8">
              Tocá el corazón en cualquier producto para guardarlo acá y comprarlo cuando quieras.
            </p>
            <Link
              href="/comercio/buscar"
              className="inline-flex items-center gap-2 h-11 px-6 rounded-2xl bg-[#0B1A45] text-white text-sm font-bold hover:bg-[#0B1A45]/90 transition-colors active:scale-[0.97]"
            >
              <ShoppingCart className="h-4 w-4" />
              Explorar productos
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── With products ────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)] pb-24 md:pb-12">

      <div className="max-w-350 mx-auto px-4 py-6 md:px-8 md:py-8">
        {/* Header */}
        <header className="mb-5 flex items-center gap-4 md:mb-6">
          <Link
            href="/comercio"
            className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-[#DFE1E8] flex items-center justify-center text-[#0B1A45] hover:bg-gray-50 transition-colors active:scale-95 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Guardados
            </p>
            <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-[#0B1A45] md:text-3xl truncate">
              Mi lista de deseos
            </h1>
          </div>
          <span className="shrink-0 h-6 min-w-6 px-2 rounded-full bg-[#C8FF00] text-[#0B1A45] text-xs font-bold flex items-center justify-center">
            {wishlist.length}
          </span>
          <button
            onClick={() => {
              if (confirm('¿Limpiar toda la lista de deseos?')) {
                wishlist.forEach(p => removeFromWishlist(p.id))
              }
            }}
            className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-medium text-[#7A839C] hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Limpiar lista</span>
          </button>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {wishlist.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              qty={getQty(product.id)}
              onQtyChange={v => handleQtyChange(product.id, v)}
              onAdd={() => handleAddToCart(product)}
              justAdded={justAdded[product.id] ?? false}
              view="grid"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
