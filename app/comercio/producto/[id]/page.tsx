'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  Minus, Plus, ShoppingCart,
  Package, Clock, AlertTriangle, ShieldCheck, Star, CheckCircle2, ChevronRight
} from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/review-card'
import { CriteriaRow, StarDisplay } from '@/components/star-rating'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useProducts, useDistributor } from '@/hooks/use-data'
import { getReviewsByDistributor, getDistributorRatingSummary } from '@/lib/data/reviews.service'
import { DistributorRatingSummary, Review } from '@/lib/types'
import { ProductDetailSkeleton, SkeletonBlock } from '@/components/ui/SkeletonCard'

function ProductoDetail({ id }: { id: string }) {
  const { addToCart, cart } = useApp()
  const [qty, setQty] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const [qtyInput, setQtyInput] = useState('1')
  const [reviews, setReviews] = useState<Review[]>([])
  const [ratingSummary, setRatingSummary] = useState<DistributorRatingSummary | null>(null)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  useEffect(() => { setQtyInput(String(qty)) }, [qty])

  const { data: products, loading } = useProducts()
  const product = products.find(p => p.id === id)
  const { data: distribuidora, loading: distributorLoading } = useDistributor(product?.distribuidoraId || '')

  useEffect(() => {
    if (!distribuidora?.id) {
      setReviews([])
      setRatingSummary(null)
      setReviewsLoading(false)
      return
    }

    let cancelled = false
    setReviewsLoading(true)

    Promise.all([
      getReviewsByDistributor(distribuidora.id),
      getDistributorRatingSummary(distribuidora.id),
    ])
      .then(([nextReviews, nextSummary]) => {
        if (cancelled) return
        setReviews(nextReviews)
        setRatingSummary(nextSummary)
        setReviewsLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setReviews([])
        setRatingSummary(null)
        setReviewsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [distribuidora?.id])

  if (loading || (product && distributorLoading)) {
    return <ProductDetailSkeleton />
  }

  if (!product || !distribuidora) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Link href="/comercio" className="text-primary mt-2">Volver al inicio</Link>
      </div>
    )
  }

  const stockLabel =
    product.stock > 10 ? 'En stock' :
    product.stock > 0 ? 'Poco stock' : 'Sin stock'

  const stockColor =
    product.stock > 10 ? 'bg-green-100 text-green-700' :
    product.stock > 0 ? 'bg-amber-100 text-amber-700' :
    'bg-gray-100 text-gray-500'

  const distInitials = distribuidora.companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleAddToCart = () => {
    const added = addToCart(product, distribuidora.companyName, qty)
    if (!added) return
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
  }

  const commitQty = (raw: string) => {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= 1) setQty(Math.min(product.stock || 999, n))
  }

  const inCart = cart?.items.find(item => item.product.id === id)

  return (
    <div className="min-h-screen bg-background pb-44 md:pb-12">
      <div className="max-w-6xl mx-auto md:p-8">

        <PageHero
          label={product.category}
          title={product.name}
          backHref={`/comercio/distribuidora/${product.distribuidoraId}`}
          className="md:rounded-3xl md:mt-4 pb-20 md:pb-24"
        />

        {/* Floating grid */}
        <div className="px-4 md:px-8 -mt-8 md:-mt-12 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left — product info */}
          <div className="md:col-span-8 space-y-6">

            {/* Price + distributor/stock */}
            <div className="bg-white rounded-3xl shadow-md border border-border p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Precio unitario</p>
                  <p className="font-heading font-bold text-4xl md:text-5xl text-primary">
                    {formatCurrency(product.price)}
                  </p>
                </div>
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gray-50 flex items-center justify-center text-primary shrink-0 border border-gray-100">
                  <Package className="h-10 w-10 md:h-12 md:w-12" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 text-sm">
                <Link
                  href={`/comercio/distribuidora/${distribuidora.id}`}
                  className="group rounded-2xl border border-[#DFE1E8] bg-gray-50 p-4 transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#0B1A45]/12 hover:bg-white md:p-5"
                >
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Distribuidor</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B1A45] text-xs font-bold text-white shadow-[0_8px_18px_rgba(11,26,69,0.14)]">
                      {distInitials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground leading-tight text-sm">{distribuidora.companyName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Ver distribuidora</p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors duration-150 group-hover:text-[#0B1A45]" />
                  </div>
                </Link>
                <div className="bg-gray-50 rounded-2xl p-4 md:p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stock disponible</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${stockColor}`}>
                      {stockLabel}
                    </span>
                    <p className="font-bold text-foreground">{product.stock} un.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product info list */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">Información del producto</h2>
              <div className="space-y-4 md:space-y-5 text-sm md:text-base">
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-muted-foreground font-medium">Categoría</span>
                  <span className="font-bold text-foreground bg-gray-100 px-3 py-1 rounded-lg">{product.category}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-muted-foreground font-medium">Unidad de venta</span>
                  <span className="font-bold text-foreground">Por unidad</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-muted-foreground font-medium">Entrega estimada</span>
                  <span className="font-bold flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-lg">
                    <Clock className="h-4 w-4" /> {distribuidora.deliveryTimeLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-muted-foreground font-medium">Pedido mínimo del distribuidor</span>
                  <span className="font-bold text-foreground">{formatCurrency(distribuidora.minOrder)}</span>
                </div>
              </div>
            </div>

            {/* Low stock warning */}
            {product.stock > 0 && product.stock <= 10 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start">
                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-900">Últimas unidades disponibles</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Queda poco stock de este producto. Te recomendamos pedir ahora antes de que se agote.
                  </p>
                </div>
              </div>
            )}

            {inCart && (
              <p className="text-sm text-primary text-center font-medium">
                Ya tenés {inCart.quantity} en el carrito
              </p>
            )}
          </div>

          {/* Right — desktop sticky actions + reviews */}
          <div className="md:col-span-4 space-y-6">

            {/* Agregar al pedido (desktop only) */}
            <div className="hidden md:block bg-white rounded-3xl shadow-xl border border-gray-200 p-6">
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">Agregar al pedido</h2>

              <div className="mb-6">
                <p className="text-sm font-bold text-gray-500 mb-3">Cantidad</p>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl h-14 overflow-hidden">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-14 h-full flex items-center justify-center text-gray-600 hover:text-foreground hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={qtyInput}
                    onChange={e => setQtyInput(e.target.value.replace(/[^0-9]/g, ''))}
                    onFocus={e => e.target.select()}
                    onBlur={e => commitQty(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                    className="flex-1 text-center font-bold text-lg bg-white h-full border-x border-gray-200 outline-none focus:bg-[#F7F8FA] transition-colors tabular-nums"
                  />
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    className="w-14 h-full flex items-center justify-center text-primary hover:bg-[#F1FFD1] transition-colors disabled:opacity-40"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 pt-6 border-t border-gray-100">
                <span className="font-medium text-gray-500">Total</span>
                <span className="font-heading font-bold text-3xl text-foreground">
                  {formatCurrency(product.price * qty)}
                </span>
              </div>

              <Button
                className={`w-full h-14 text-base font-bold shadow-lg gap-2 rounded-xl transition-all duration-300 ${
                  isAdded
                    ? 'bg-green-600 hover:bg-green-600 shadow-green-200'
                    : 'shadow-primary/20'
                }`}
                onClick={handleAddToCart}
                disabled={isAdded || product.stock === 0}
              >
                {isAdded ? (
                  <><CheckCircle2 className="h-5 w-5 animate-check-pop" /> Agregado</>
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Agregar al carrito</>
                )}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Compra 100% segura
              </div>
            </div>

            {/* Distributor reviews */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reseñas de la distribuidora</p>
              <h2 className="mt-1 font-heading text-xl font-bold text-foreground">{distribuidora.companyName}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Este producto no tiene reseñas propias en esta versión. Las calificaciones que ves acá corresponden a la distribuidora.
              </p>

              {reviewsLoading ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <SkeletonBlock className="h-10 w-20" />
                    <SkeletonBlock className="mt-3 h-3 w-28" />
                    <div className="mt-4 space-y-2">
                      {[1, 2, 3, 4].map(item => (
                        <SkeletonBlock key={item} className="h-3 rounded-full" />
                      ))}
                    </div>
                  </div>
                  {[1, 2].map(item => (
                    <SkeletonBlock key={item} className="h-28 rounded-2xl" />
                  ))}
                </div>
              ) : ratingSummary && ratingSummary.reviewCount > 0 ? (
                <>
                  <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                    <div className="flex flex-col gap-4">
                      <div className="rounded-2xl bg-white p-4 text-center shadow-sm">
                        <p className="font-heading text-4xl font-bold text-foreground">{ratingSummary.averageGeneral.toFixed(1)}</p>
                        <StarDisplay rating={ratingSummary.averageGeneral} size="sm" className="mt-2 justify-center" />
                        <p className="mt-2 text-xs font-medium text-muted-foreground">{ratingSummary.reviewCount} reseñas</p>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <CriteriaRow label="Cumplimiento" value={ratingSummary.averageFulfillment} />
                        <CriteriaRow label="Entrega" value={ratingSummary.averageDelivery} />
                        <CriteriaRow label="Mercadería" value={ratingSummary.averageProductCondition} />
                        <CriteriaRow label="Atención" value={ratingSummary.averageCommunication} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {reviews.slice(0, 2).map(review => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Star className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="mt-3 font-semibold text-foreground">Todavía no hay reseñas de la distribuidora</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cuando otros comercios califiquen sus pedidos, las vas a ver acá.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom action */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-8px_30px_-18px_rgba(31,41,55,0.45)]">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl h-14 overflow-hidden shrink-0">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-foreground"
            >
              <Minus className="h-5 w-5" />
            </button>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={qtyInput}
              onChange={e => setQtyInput(e.target.value.replace(/[^0-9]/g, ''))}
              onFocus={e => e.target.select()}
              onBlur={e => commitQty(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="w-10 text-center font-bold text-lg bg-white h-full border-x border-gray-200 outline-none focus:bg-[#F7F8FA] transition-colors tabular-nums"
            />
            <button
              onClick={() => setQty(q => Math.min(product.stock, q + 1))}
              disabled={qty >= product.stock}
              className="w-12 h-full flex items-center justify-center text-primary disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <Button
            className={`flex-1 h-14 text-base font-bold shadow-lg rounded-xl transition-all duration-300 ${
              isAdded ? 'bg-green-600 hover:bg-green-600 shadow-green-200' : 'shadow-primary/20'
            }`}
            onClick={handleAddToCart}
            disabled={isAdded || product.stock === 0}
          >
            {isAdded ? (
              <><CheckCircle2 className="h-4 w-4 mr-2 animate-check-pop" /> Agregado</>
            ) : (
              <><ShoppingCart className="h-4 w-4 mr-2" /> {formatCurrency(product.price * qty)}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ProductoDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <ProductoDetail id={id} />
}
