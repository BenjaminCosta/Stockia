'use client'

import { useState, useCallback, useEffect, useMemo, use } from 'react'
import Link from 'next/link'
import { Package, FileText, Star } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { PageHero } from '@/components/ui/PageHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { PillFilter } from '@/components/ui/PillFilter'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useDistributor, useProducts } from '@/hooks/use-data'
import { DistributorDetailSkeleton, ProductCardSkeleton } from '@/components/ui/SkeletonCard'
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
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())

  const { data: distribuidora, loading: isLoading } = useDistributor(id)
  const { data: products, loading: productsLoading } = useProducts(id)
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingSummary, setRatingSummary] = useState<DistributorRatingSummary | null>(null)

  useEffect(() => {
    getReviewsByDistributor(id).then(setReviews)
    getDistributorRatingSummary(id).then(setRatingSummary)
  }, [id])

  const categoryList = useMemo(() => {
    // Use distributorCategory (raw) when available so the distributor's own
    // category names appear in pills (e.g. "GASEOSAS", "CACHI"). Fall back to
    // the official category for manually-created products.
    const cats = [...new Set(products.map(p => p.distributorCategory ?? p.category))]
    return ['Todos', ...cats.filter(Boolean)]
  }, [products])

  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const productCat = p.distributorCategory ?? p.category
    const matchesCategory = selectedCategory === 'Todos' || productCat === selectedCategory
    return matchesSearch && matchesCategory && p.active
  }), [products, searchQuery, selectedCategory])

  const handleAgregar = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product || !distribuidora) return
    const qty = Math.min(quantities[productId] ?? 1, Math.max(1, product.stock))
    const added = addToCart(product, distribuidora.companyName, qty)
    if (!added) return
    setAddedProducts(prev => new Set(prev).add(productId))
    window.setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }, 2000)
  }, [addToCart, distribuidora, products, quantities])

  if (isLoading) {
    return <DistributorDetailSkeleton />
  }

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
        <div className="flex-1 min-w-0">
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

          <div className="md:px-8 md:mt-8 min-w-0">
            {/* Category pills — overflow-x-auto so many pills scroll instead of breaking layout */}
            <div className="w-full overflow-x-hidden">
              <PillFilter
                items={categoryList.map(cat => ({ value: cat, label: cat }))}
                selected={selectedCategory}
                onChange={setSelectedCategory}
                className="mt-6 px-4 md:px-0 flex-nowrap"
              />
            </div>

            {/* Search */}
            <SearchInput
              placeholder="Buscar productos por nombre, marca o código..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="px-4 md:px-0 mt-4 md:mt-6"
            />

            {/* Products */}
            <div className="px-2.5 mt-5 md:mt-6 md:px-0">
              {isLoading || productsLoading ? (
                <ProductCardSkeleton count={6} className="md:grid-cols-2 lg:grid-cols-3" />
              ) : filteredProducts.length === 0 ? (
                <EmptyState
                  icon={Package}
                  imageSrc="/assets/product-3d.png"
                  title="Sin resultados"
                  description="No se encontraron productos con ese nombre o categoría"
                />
              ) : (
                <>
                  {/* Mobile — 2-col grid */}
                  <div className="grid grid-cols-2 gap-2 pb-12 md:hidden">
                    {filteredProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        distName={distribuidora.companyName}
                        qty={quantities[product.id] ?? 1}
                        onQtyChange={v => setQuantities(prev => ({ ...prev, [product.id]: Math.min(Math.max(1, v), Math.max(1, product.stock)) }))}
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
                        distName={distribuidora.companyName}
                        qty={quantities[product.id] ?? 1}
                        onQtyChange={v => setQuantities(prev => ({ ...prev, [product.id]: Math.min(Math.max(1, v), Math.max(1, product.stock)) }))}
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
      </div>
    </div>
  )
}
