'use client'

import { useState, useCallback, useEffect, use } from 'react'
import Link from 'next/link'
import { Info, Package, FileText, Star } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { PageHero } from '@/components/ui/PageHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { PillFilter } from '@/components/ui/PillFilter'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useDistributor, useProducts } from '@/hooks/use-data'
import { ProductCardSkeleton } from '@/components/ui/SkeletonCard'
import { ProductCard } from '@/components/product-card'
import { getReviewsByDistributor, getDistributorRatingSummary } from '@/lib/data/reviews.service'
import { Review, DistributorRatingSummary } from '@/lib/types'
import { StarDisplay, CriteriaRow } from '@/components/star-rating'
import { ReviewCard } from '@/components/review-card'

export default function DistribuidoraCatalogPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { addToCart } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [cartItems, setCartItems] = useState<Record<string, number>>({})
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())

  const { data: distribuidora, loading: isLoading } = useDistributor(id)
  const { data: products } = useProducts(id)
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingSummary, setRatingSummary] = useState<DistributorRatingSummary | null>(null)

  useEffect(() => {
    getReviewsByDistributor(id).then(setReviews)
    getDistributorRatingSummary(id).then(setRatingSummary)
  }, [id])

  const productCategories = [...new Set(products.map(p => p.category))]
  const categoryList = ['Todos', ...productCategories]

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory
    return matchesSearch && matchesCategory && p.active
  })

  const totalItems = Object.values(cartItems).reduce((a, b) => a + b, 0)
  const totalAmount = Object.entries(cartItems).reduce((sum, [pId, qty]) => {
    const p = products.find(prod => prod.id === pId)
    return sum + (p?.price || 0) * qty
  }, 0)

  const handleAgregar = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product || !distribuidora) return
    const qty = quantities[productId] ?? 1
    addToCart(product, distribuidora.companyName, qty)
    setAddedProducts(prev => new Set(prev).add(productId))
    setCartItems(prev => ({ ...prev, [productId]: (prev[productId] || 0) + qty }))
    window.setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }, 2000)
  }, [addToCart, distribuidora, products, quantities])

  if (!distribuidora) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Distribuidora no encontrada</p>
        <Link href="/comercio" className="text-primary mt-2">Volver al inicio</Link>
      </div>
    )
  }

  const initials = distribuidora.companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-background pb-44 md:pb-12">
      <div className="md:flex max-w-7xl mx-auto items-start md:p-6 gap-8">
        <div className="flex-1">
          <PageHero
            title={distribuidora.companyName}
            backHref="/comercio"
            badge={
              <div className="hidden md:flex h-20 w-20 rounded-2xl bg-white items-center justify-center font-bold text-primary text-3xl shrink-0 shadow-xl">
                {initials}
              </div>
            }
            className="md:rounded-3xl rounded-b-3xl pb-8 md:pb-12"
          >
            <div className="flex items-center gap-3 text-white/70 text-sm md:text-base font-medium flex-wrap">
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Mín. {formatCurrency(distribuidora.minOrder || 15000)}
              </span>
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5">
                <Package className="h-4 w-4" /> 48hs hábiles
              </span>
              {ratingSummary && ratingSummary.reviewCount > 0 && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-300 fill-amber-300" />
                    <span className="text-white/90 font-semibold">{ratingSummary.averageGeneral.toFixed(1)}</span>
                    <span>({ratingSummary.reviewCount})</span>
                  </span>
                </>
              )}
            </div>
          </PageHero>

          {/* Floating info card */}
          <div className="px-4 md:px-8 -mt-4 relative z-10">
            <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 text-sm border border-gray-100">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <p className="text-gray-600">
                Haciendo pedido hoy, recibís el <span className="font-bold text-foreground text-base">Jueves</span>
              </p>
            </div>
          </div>

          <div className="md:px-8 md:mt-8">
            {/* Category pills */}
            <PillFilter
              items={categoryList.map(cat => ({ value: cat, label: cat }))}
              selected={selectedCategory}
              onChange={setSelectedCategory}
              className="mt-6 px-4 md:px-0"
            />

            {/* Search */}
            <SearchInput
              placeholder="Buscar productos por nombre, marca o código..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="px-4 md:px-0 mt-4 md:mt-6"
            />

            {/* Products */}
            <div className="px-4 md:px-0 mt-6">
              {isLoading ? (
                <ProductCardSkeleton />
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="Sin resultados"
                  description="No se encontraron productos con ese nombre o categoría"
                />
              ) : (
                <>
                  {/* Mobile — 2-col grid */}
                  <div className="grid grid-cols-2 gap-3 md:hidden pb-12 px-4">
                    {filteredProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        qty={quantities[product.id] ?? 1}
                        onQtyChange={v => setQuantities(prev => ({ ...prev, [product.id]: v }))}
                        onAdd={() => handleAgregar(product.id)}
                        justAdded={addedProducts.has(product.id)}
                        view="grid"
                      />
                    ))}
                  </div>

                  {/* Desktop — grid */}
                  <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                    {filteredProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        qty={quantities[product.id] ?? 1}
                        onQtyChange={v => setQuantities(prev => ({ ...prev, [product.id]: v }))}
                        onAdd={() => handleAgregar(product.id)}
                        justAdded={addedProducts.has(product.id)}
                        view="grid"
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Ratings & Reviews section ── */}
            {ratingSummary && ratingSummary.reviewCount > 0 && (
              <div className="px-4 md:px-0 mt-8 pb-8">
                <h2 className="font-heading font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  Reseñas de comercios
                </h2>

                {/* Summary card */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
                  <div className="flex items-center gap-6 mb-5">
                    <div className="text-center">
                      <p className="font-heading font-bold text-5xl text-gray-900">
                        {ratingSummary.averageGeneral.toFixed(1)}
                      </p>
                      <StarDisplay rating={ratingSummary.averageGeneral} size="md" className="mt-1 justify-center" />
                      <p className="text-xs text-gray-400 mt-1">{ratingSummary.reviewCount} reseña{ratingSummary.reviewCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex-1 space-y-2">
                      <CriteriaRow label="Cumplimiento" value={ratingSummary.averageFulfillment} />
                      <CriteriaRow label="Entrega" value={ratingSummary.averageDelivery} />
                      <CriteriaRow label="Mercadería" value={ratingSummary.averageProductCondition} />
                      <CriteriaRow label="Atención" value={ratingSummary.averageCommunication} />
                    </div>
                  </div>
                </div>

                {/* Reviews list */}
                <div className="space-y-3">
                  {reviews.slice(0, 5).map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop sticky cart sidebar */}
        {totalItems > 0 && (
          <div className="hidden md:block w-[360px] shrink-0 sticky top-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-heading font-bold text-xl text-foreground">Tu Pedido</h2>
                <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-sm">
                  {totalItems} ítems
                </span>
              </div>
              <div className="p-6">
                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 mb-6">
                  {Object.entries(cartItems).map(([pId, qty]) => {
                    const p = products.find(prod => prod.id === pId)
                    if (!p) return null
                    return (
                      <div key={pId} className="flex justify-between items-start gap-4 text-sm">
                        <div className="flex-1">
                          <p className="font-bold text-foreground leading-tight">{p.name}</p>
                          <p className="text-muted-foreground mt-1">{formatCurrency(p.price)} x {qty}</p>
                        </div>
                        <div className="font-heading font-bold text-foreground shrink-0">
                          {formatCurrency(p.price * qty)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-gray-100 pt-6 space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl text-foreground pt-2 border-t border-gray-100 mt-2">
                    <span>Total</span>
                    <span className="font-heading text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
                <Link href="/comercio/carrito">
                  <button className="w-full h-14 text-base font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                    Ir al checkout
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky bottom bar */}
      {totalItems > 0 && (
        <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40 shadow-[0_-8px_30px_-18px_rgba(31,41,55,0.45)]">
          <Link href="/comercio/carrito">
            <div className="bg-primary text-white rounded-2xl p-4 flex justify-between items-center shadow-xl shadow-primary/20 active:scale-[0.98] cursor-pointer transition-all animate-cart-pulse">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl h-10 w-10 flex items-center justify-center font-bold text-lg">
                  {totalItems}
                </div>
                <span className="font-bold text-lg">Ver carrito</span>
              </div>
              <div className="font-heading font-bold text-2xl">{formatCurrency(totalAmount)}</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
