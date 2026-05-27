'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ShoppingCart, ChevronRight, X, Store, MapPin, Star } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { formatCurrency } from '@/lib/mock-data'
import { useApp } from '@/lib/app-context'
import { useProducts, useDistributors, useCategories } from '@/hooks/use-data'
import { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/product-card'
import { ProductCardSkeleton } from '@/components/ui/SkeletonCard'
// ── Floating Cart Bar ────────────────────────────────────────────────────────

function FloatingCartBar() {
  const { cart, getCartTotal, removeFromCart } = useApp()
  const { data: distributors } = useDistributors()
  const total = getCartTotal()

  if (!cart || cart.items.length === 0) return null

  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)
  const dist = distributors.find(d => d.id === cart.distribuidoraId)
  const minOrder = dist?.minOrder ?? 0
  const remaining = Math.max(0, minOrder - total)

  return (
    <div className="fixed bottom-16 lg:bottom-6 left-0 right-0 z-40 px-4 lg:px-8 pointer-events-none">
      <div className="max-w-350 mx-auto pointer-events-auto">
        <div className="bg-[#0B1A45] rounded-2xl shadow-[0_8px_32px_rgba(11,26,69,0.32)] border border-white/10 overflow-hidden">

          {/* Items row — scrollable chips with remove */}
          <div className="px-3 pt-2.5 pb-1.5 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {cart.items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex-none flex items-center gap-1.5 bg-white/8 hover:bg-white/12 rounded-full pl-2.5 pr-1.5 py-1 transition-colors"
              >
                <span className="text-white text-[11px] font-medium whitespace-nowrap max-w-28 truncate">
                  {quantity > 1 && (
                    <span className="text-[#C8FF00] font-bold mr-1">{quantity}×</span>
                  )}
                  {product.name}
                </span>
                <button
                  onClick={() => removeFromCart(product.id)}
                  aria-label={`Quitar ${product.name}`}
                  className="h-4 w-4 rounded-full bg-white/15 hover:bg-red-500/70 flex items-center justify-center text-white/60 hover:text-white transition-all flex-none"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Main action row */}
          <div className="px-4 pb-3 flex items-center gap-3 lg:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="bg-[#C8FF00] text-[#0B1A45] text-[11px] font-bold px-2.5 py-0.5 rounded-full shrink-0 leading-tight">
                  {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
                </span>
                {cart.distribuidoraName && (
                  <span className="text-white/50 text-xs truncate hidden sm:block">
                    {cart.distribuidoraName}
                  </span>
                )}
              </div>
              {remaining > 0 ? (
                <p className="text-amber-300 text-[11px] font-medium mt-0.5">
                  Faltan {formatCurrency(remaining)} para el mínimo
                </p>
              ) : minOrder > 0 ? (
                <p className="text-[#C8FF00] text-[11px] font-semibold mt-0.5">✓ Mínimo alcanzado</p>
              ) : null}
            </div>

            <span className="text-white font-bold text-base shrink-0">
              {formatCurrency(total)}
            </span>

            <Link
              href="/comercio/carrito"
              className="shrink-0 h-9 px-4 rounded-xl bg-[#C8FF00] text-[#0B1A45] font-bold text-sm flex items-center gap-1.5 hover:bg-[#d4ff1a] active:scale-[0.97] transition-all duration-150"
            >
              Ver carrito <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BuscarPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedCategory = searchParams.get('categoria')
  const ofertaFilter = searchParams.get('oferta') === '1'
  const queryParam = searchParams.get('q') ?? ''

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [debouncedQuery, setDebouncedQuery] = useState(queryParam)
  const [quantities, setQuantities]   = useState<Record<string, number>>({})
  const [justAdded, setJustAdded]     = useState<Record<string, boolean>>({})
  const { addToCart, getCartItemCount, cart } = useApp()
  const cartItemCount = getCartItemCount()
  const { data: products, loading: isLoading } = useProducts()
  const { data: distributors } = useDistributors()
  const { data: allCategories } = useCategories()

  useEffect(() => {
    setSearchQuery(queryParam)
    setDebouncedQuery(queryParam)
  }, [queryParam])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  const handleCategoryClick = (name: string | null) => {
    if (name) {
      router.replace(`/comercio/buscar?categoria=${encodeURIComponent(name)}`)
    } else {
      router.replace('/comercio/buscar')
    }
  }

  const distributorMap = useMemo(() => new Map(distributors.map(d => [d.id, d])), [distributors])

  const activeProducts = useMemo(() => products.filter((p: Product) => p.active), [products])

  const normalizedQuery = debouncedQuery.trim()
  const normalizedSearch = normalizedQuery.toLowerCase()

  const matchingDistributors = useMemo(() => {
    if (!normalizedSearch) return []
    return distributors.filter(distributor => {
      const distributorProducts = activeProducts.filter(product => product.distribuidoraId === distributor.id)
      return (
        distributor.companyName.toLowerCase().includes(normalizedSearch) ||
        distributor.categories.some(category => category.toLowerCase().includes(normalizedSearch)) ||
        distributorProducts.some(product =>
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.category.toLowerCase().includes(normalizedSearch)
        )
      )
    })
  }, [distributors, activeProducts, normalizedSearch])

  const filteredProducts = useMemo(() => activeProducts.filter((p: Product) => {
    const q = normalizedSearch
    const distributor = distributorMap.get(p.distribuidoraId)
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (distributor?.companyName.toLowerCase().includes(q) ?? false)
    const matchesCategory = !selectedCategory || p.category === selectedCategory
    const matchesOffer = !ofertaFilter || p.isOffer === true
    return matchesSearch && matchesCategory && matchesOffer
  }), [activeProducts, normalizedSearch, distributorMap, selectedCategory, ofertaFilter])
  const pageTitle = normalizedQuery
    ? `Resultados para "${normalizedQuery}"`
    : ofertaFilter
      ? 'Ofertas'
      : selectedCategory
        ? `Productos de ${selectedCategory}`
        : 'Buscar productos'

  const getQty = (id: string) => quantities[id] ?? 1
  const setQty = (id: string, v: number) => setQuantities(prev => ({ ...prev, [id]: v }))

  const handleAdd = useCallback((product: Product) => {
    const dist = distributorMap.get(product.distribuidoraId)
    if (!dist) return
    const qty = quantities[product.id] ?? 1
    const added = addToCart(product, dist.companyName, qty)
    if (!added) return
    setJustAdded(prev => ({ ...prev, [product.id]: true }))
    setTimeout(() => setJustAdded(prev => ({ ...prev, [product.id]: false })), 2000)
  }, [addToCart, quantities, distributorMap])

  const hasCartItems = !!(cart && cart.items.length > 0)

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA]">

      {/* Sticky sub-header */}
      <div className="sticky top-12 z-30 bg-white border-b border-[#DFE1E8] shadow-[0_1px_4px_rgba(11,26,69,0.05)] lg:hidden">
        <div className="max-w-350 mx-auto px-4 md:px-8 py-3">
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

          {/* Category pills — all visible categories */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => handleCategoryClick(null)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border',
                selectedCategory === null
                  ? 'bg-[#0B1A45] text-white border-[#0B1A45]'
                  : 'bg-white text-[#7A839C] border-[#DFE1E8] hover:border-[#0B1A45]/30',
              )}
            >
              Todos
            </button>
            {allCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
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
      <main className={cn('flex-1 max-w-350 mx-auto px-4 md:px-8 py-6 w-full', hasCartItems && 'pb-32 lg:pb-28')}>
        <header className="mb-5 md:mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {selectedCategory ? 'Categoría' : 'Catálogo'}
              </p>
              <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">
                {pageTitle}
              </h1>
            </div>
            {selectedCategory && (
              <Link
                href="/comercio/buscar"
                className="w-fit rounded-full border border-[#DFE1E8] bg-white px-3 py-1.5 text-xs font-bold text-[#0B1A45] shadow-sm transition-colors hover:border-[#0B1A45]/25 hover:bg-[#F7F8FA] active:scale-[0.97]"
              >
                Ver todo el catálogo
              </Link>
            )}
          </div>
        </header>

        {normalizedQuery && matchingDistributors.length > 0 && (
          <section className="mb-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Distribuidoras
                </p>
                <h2 className="font-heading text-base font-bold tracking-tight text-[#0B1A45] md:text-lg">
                  Proveedores que coinciden
                </h2>
              </div>
              <span className="rounded-full border border-[#DFE1E8] bg-white px-3 py-1 text-xs font-bold text-[#0B1A45] shadow-sm">
                {matchingDistributors.length}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {matchingDistributors.slice(0, 6).map(distributor => (
                <Link
                  key={distributor.id}
                  href={`/comercio/distribuidora/${distributor.id}`}
                  className="group rounded-[1.35rem] border border-[#DFE1E8] bg-white p-3 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_12px_32px_rgba(11,26,69,0.06)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#0B1A45]/20 hover:shadow-[0_16px_42px_rgba(11,26,69,0.10)]"
                >
                  <article className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1FFD1] font-heading text-sm font-bold text-[#0B1A45] ring-1 ring-[#C8FF00]/45">
                      {distributor.initials || distributor.companyName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-[#0B1A45] transition-colors group-hover:text-[#17295C]">
                            {distributor.companyName}
                          </h3>
                          <p className="mt-0.5 truncate text-xs font-medium text-[#7A839C]">
                            {distributor.categories.slice(0, 3).join(' · ')}
                          </p>
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#7A839C] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0B1A45]" />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#7A839C]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {distributor.distance}
                        </span>
                        {distributor.rating ? (
                          <span className="inline-flex items-center gap-1 text-[#0B1A45]">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {distributor.rating.toFixed(1)}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <Store className="h-3.5 w-3.5" />
                          Mín. {formatCurrency(distributor.minOrder)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="flex-1 min-w-0">
            {isLoading ? (
              <>
                <ProductCardSkeleton count={4} className="px-4 lg:hidden" />
                <ProductCardSkeleton count={8} className="hidden lg:grid" />
              </>
            ) : filteredProducts.length === 0 && matchingDistributors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="h-14 w-14 rounded-2xl bg-white border border-[#DFE1E8] flex items-center justify-center shadow-sm">
                  <Package className="h-7 w-7 text-gray-300" />
                </div>
                <p className="font-bold text-[#0B1A45]">Sin resultados</p>
                <p className="text-sm text-[#7A839C]">Probá con otro término o categoría</p>
                <button
                  onClick={() => { setSearchQuery(''); router.replace('/comercio/buscar') }}
                  className="text-[#0B1A45] text-sm font-semibold underline mt-1"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                {filteredProducts.length > 0 && (
                  <p className="text-xs text-[#7A839C] mb-4 font-medium">
                    {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                  </p>
                )}

                {/* Mobile — 2-col grid */}
                <div className="grid grid-cols-2 gap-3 lg:hidden px-4">
                  {filteredProducts.map((product: Product) => {
                    const dist = distributorMap.get(product.distribuidoraId)
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

                {/* Desktop — grid */}
                <div className="hidden lg:grid grid-cols-4 gap-3">
                  {filteredProducts.map((product: Product) => {
                    const dist = distributorMap.get(product.distribuidoraId)
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
      </main>

      <FloatingCartBar />
    </div>
  )
}
