'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Package, Check, Minus, Plus, ShoppingCart, Trash2, ChevronRight } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { mockProducts, categories, formatCurrency, mockDistributorCards } from '@/lib/mock-data'
import { useMockLoading } from '@/hooks/use-mock-loading'
import { useApp } from '@/lib/app-context'
import { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/product-card'

// Only these 4 categories are shown in the filter pills
const VISIBLE_CATEGORIES = ['Bebidas', 'Almacén', 'Limpieza', 'Lácteos']

// ── Cart Sidebar ──────────────────────────────────────────────────────────────

function CartSidebar() {
  const { cart, getCartTotal, removeFromCart, updateCartItemQuantity } = useApp()
  const total = getCartTotal()
  const dist = mockDistributorCards.find(d => d.id === cart?.distribuidoraId)

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#DFE1E8] p-8 flex flex-col items-center gap-3 text-center">
        <div className="h-14 w-14 rounded-2xl bg-[#F7F8FA] flex items-center justify-center">
          <ShoppingCart className="h-6 w-6 text-gray-300" />
        </div>
        <p className="font-semibold text-[#0B1A45] text-sm">Tu carrito está vacío</p>
        <p className="text-xs text-[#7A839C]">Agregá productos para armar tu pedido</p>
      </div>
    )
  }

  const minOrder = dist?.minOrder ?? 0
  const remaining = Math.max(0, minOrder - total)
  const progress = minOrder > 0 ? Math.min(100, (total / minOrder) * 100) : 100

  return (
    <div className="bg-white rounded-2xl border border-[#DFE1E8] overflow-hidden shadow-sm">
      <div className="px-5 py-4 bg-[#0B1A45]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm">Carrito de compras</p>
            <p className="text-white/50 text-xs mt-0.5 truncate max-w-[140px]">{cart.distribuidoraName}</p>
          </div>
          <span className="bg-[#C8FF00] text-[#0B1A45] text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
            {cart.items.reduce((s, i) => s + i.quantity, 0)} ítems
          </span>
        </div>
      </div>

      {minOrder > 0 && (
        <div className={cn('px-4 py-3 border-b', remaining > 0 ? 'bg-amber-50 border-amber-100' : 'bg-[rgba(137,179,23,0.06)] border-[#89B317]/15')}>
          {remaining > 0 ? (
            <>
              <p className="text-xs text-amber-700 font-medium">
                Te faltan <span className="font-bold">{formatCurrency(remaining)}</span> para el mínimo
              </p>
              <div className="mt-1.5 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </>
          ) : (
            <p className="text-xs text-[#4A662E] font-semibold flex items-center gap-1">
              <Check className="h-3 w-3" /> Mínimo alcanzado
            </p>
          )}
        </div>
      )}

      <div className="max-h-72 overflow-y-auto divide-y divide-[#F7F8FA]">
        {cart.items.map(({ product, quantity }) => {
          const catObj = categories.find(c => c.name === product.category)
          return (
            <div key={product.id} className="px-4 py-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-[#F7F8FA] flex items-center justify-center shrink-0">
                {catObj ? (
                  <img src={catObj.image} alt="" className="h-7 w-7 object-contain" />
                ) : (
                  <Package className="h-4 w-4 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#0B1A45] line-clamp-1">{product.name}</p>
                <p className="text-[11px] text-[#7A839C]">{formatCurrency(product.price)} × {quantity}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="flex items-center rounded-lg border border-[#DFE1E8] overflow-hidden">
                  <button
                    onClick={() => updateCartItemQuantity(product.id, quantity - 1)}
                    className="h-6 w-6 flex items-center justify-center text-[#0B1A45] hover:bg-[#F7F8FA]"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-[#0B1A45]">{quantity}</span>
                  <button
                    onClick={() => updateCartItemQuantity(product.id, quantity + 1)}
                    className="h-6 w-6 flex items-center justify-center text-[#0B1A45] hover:bg-[#F7F8FA]"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(product.id)}
                  className="h-6 w-6 flex items-center justify-center text-gray-300 hover:text-red-400 transition"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 border-t border-[#DFE1E8] bg-[#FAFAFA]">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm text-[#7A839C]">Subtotal</span>
          <span className="font-bold text-[#0B1A45] text-base">{formatCurrency(total)}</span>
        </div>
        {minOrder > 0 && (
          <p className="text-[11px] text-[#7A839C] mb-3">Pedido mínimo: {formatCurrency(minOrder)}</p>
        )}
        <Link
          href="/comercio/carrito"
          className={cn(
            'flex items-center justify-center gap-2 w-full h-11 rounded-xl font-bold text-sm transition-all',
            remaining === 0
              ? 'bg-[#0B1A45] text-white hover:bg-[#0B1A45]/90'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none',
          )}
        >
          {remaining === 0 ? (
            <>
              Continuar pedido <ChevronRight className="h-4 w-4" />
            </>
          ) : (
            `Faltan ${formatCurrency(remaining)}`
          )}
        </Link>
      </div>
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProductSkeleton({ view }: { view: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="bg-white rounded-2xl border border-[#DFE1E8] p-3 flex items-center gap-3 animate-pulse">
        <div className="h-16 w-16 rounded-xl bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-5 bg-gray-100 rounded w-1/3" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-8 w-24 bg-gray-100 rounded-xl" />
          <div className="h-8 w-24 bg-gray-100 rounded-xl" />
        </div>
      </div>
    )
  }
  return (
    <div className="bg-white rounded-2xl border border-[#DFE1E8] overflow-hidden animate-pulse">
      <div className="h-44 bg-gray-100 mx-3 mt-3 rounded-xl" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-7 bg-gray-100 rounded w-1/3" />
        <div className="h-9 bg-gray-100 rounded-xl" />
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BuscarPage() {
  const [searchQuery, setSearchQuery]           = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [quantities, setQuantities]             = useState<Record<string, number>>({})
  const [justAdded, setJustAdded]               = useState<Record<string, boolean>>({})
  const isLoading = useMockLoading()
  const { addToCart, getCartItemCount } = useApp()
  const cartItemCount = getCartItemCount()

  const visibleCategories = categories.filter(c => VISIBLE_CATEGORIES.includes(c.name))

  const activeProducts = mockProducts.filter(p => p.active)
  const filteredProducts = activeProducts.filter(p => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    const matchesCategory = !selectedCategory || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getQty = (id: string) => quantities[id] ?? 1
  const setQty = (id: string, v: number) => setQuantities(prev => ({ ...prev, [id]: v }))

  const handleAdd = useCallback((product: Product) => {
    const dist = mockDistributorCards.find(d => d.id === product.distribuidoraId)
    if (!dist) return
    const qty = quantities[product.id] ?? 1
    addToCart(product, dist.companyName, qty)
    setJustAdded(prev => ({ ...prev, [product.id]: true }))
    setTimeout(() => setJustAdded(prev => ({ ...prev, [product.id]: false })), 2000)
  }, [addToCart, quantities])

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA]">

      {/* Sticky sub-header */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#DFE1E8] shadow-[0_1px_4px_rgba(11,26,69,0.05)]">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-3">
          <div className="flex items-center gap-3">
            <SearchInput
              placeholder="Buscar productos, marcas o categorías..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="flex-1 max-w-xl"
            />
            <Link
              href="/comercio/carrito"
              className="lg:hidden relative h-10 w-10 flex items-center justify-center bg-[#F7F8FA] rounded-xl border border-[#DFE1E8] shrink-0"
            >
              <ShoppingCart className="h-5 w-5 text-[#0B1A45]" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C8FF00] text-[#0B1A45] text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Category pills — only 4 */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border',
                selectedCategory === null
                  ? 'bg-[#0B1A45] text-white border-[#0B1A45]'
                  : 'bg-white text-[#7A839C] border-[#DFE1E8] hover:border-[#0B1A45]/30',
              )}
            >
              Todos
            </button>
            {visibleCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={cn(
                  'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border',
                  selectedCategory === cat.name
                    ? 'bg-[#0B1A45] text-white border-[#0B1A45]'
                    : 'bg-white text-[#7A839C] border-[#DFE1E8] hover:border-[#0B1A45]/30',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-[1400px] mx-auto px-4 md:px-8 py-6 w-full">
        <div className="flex gap-6 items-start">

          <section className="flex-1 min-w-0">
            {isLoading ? (
              <>
                <div className="flex flex-col gap-3 lg:hidden">
                  {[...Array(4)].map((_, i) => <ProductSkeleton key={i} view="list" />)}
                </div>
                <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => <ProductSkeleton key={i} view="grid" />)}
                </div>
              </>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="h-14 w-14 rounded-2xl bg-white border border-[#DFE1E8] flex items-center justify-center shadow-sm">
                  <Package className="h-7 w-7 text-gray-300" />
                </div>
                <p className="font-bold text-[#0B1A45]">Sin resultados</p>
                <p className="text-sm text-[#7A839C]">Probá con otro término o categoría</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null) }}
                  className="text-[#0B1A45] text-sm font-semibold underline mt-1"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-[#7A839C] mb-4 font-medium">
                  {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                </p>

                {/* Mobile — list */}
                <div className="flex flex-col gap-3 lg:hidden">
                  {filteredProducts.map(product => {
                    const dist = mockDistributorCards.find(d => d.id === product.distribuidoraId)
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        distName={dist?.companyName}
                        distDistance={dist?.distance}
                        qty={getQty(product.id)}
                        onQtyChange={v => setQty(product.id, v)}
                        onAdd={() => handleAdd(product)}
                        justAdded={!!justAdded[product.id]}
                        view="list"
                      />
                    )
                  })}
                </div>

                {/* Desktop — grid */}
                <div className="hidden lg:grid grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredProducts.map(product => {
                    const dist = mockDistributorCards.find(d => d.id === product.distribuidoraId)
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        distName={dist?.companyName}
                        distDistance={dist?.distance}
                        qty={getQty(product.id)}
                        onQtyChange={v => setQty(product.id, v)}
                        onAdd={() => handleAdd(product)}
                        justAdded={!!justAdded[product.id]}
                        view="grid"
                      />
                    )
                  })}
                </div>
              </>
            )}
          </section>

          {/* Sticky cart sidebar — desktop only */}
          <aside className="hidden lg:block w-80 shrink-0 sticky top-48">
            <CartSidebar />
          </aside>
        </div>
      </main>
    </div>
  )
}
