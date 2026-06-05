'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import {
  Minus, Plus, ShoppingCart,
  Package, ShieldCheck, Star, CheckCircle2, ChevronRight, Info, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/review-card'
import { CriteriaRow, StarDisplay } from '@/components/star-rating'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useProducts, useDistributor } from '@/hooks/use-data'
import { getReviewsByDistributor, getDistributorRatingSummary } from '@/lib/data/reviews.service'
import { DistributorRatingSummary, Review } from '@/lib/types'
import { ProductDetailSkeleton, SkeletonBlock } from '@/components/ui/SkeletonCard'
import { InternalHeaderBackground } from '@/components/internal-header-background'

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

  const distInitials = distribuidora.companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const inCart = cart?.items.find(item => item.product.id === id)
  const availableToAdd = Math.max(0, product.stock - (inCart?.quantity ?? 0))
  const canAdd = product.status === 'active' && availableToAdd > 0
  const subtotal = product.price * qty
  const isOffer = Boolean(product.isOffer)
  const imageSrc = product.imageUrl || '/placeholder.svg'

  const handleAddToCart = () => {
    const added = addToCart(product, distribuidora.companyName, Math.min(qty, Math.max(1, availableToAdd)))
    if (!added) return
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
  }

  const commitQty = (raw: string) => {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= 1) setQty(Math.min(Math.max(1, availableToAdd), n))
  }

  const purchasePanel = (
    <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_16px_48px_rgba(11,26,69,0.08)] md:p-6">
      <h2 className="font-heading text-xl font-bold text-foreground">Agregar al pedido</h2>
      <div className="mt-5">
        <p className="text-sm font-semibold text-muted-foreground">Precio unitario</p>
        <p className="mt-1 font-heading text-5xl font-bold tracking-tight text-[#0B1A45]">
          {formatCurrency(product.price)}
        </p>
      </div>

      <div className="mt-6">
        <p className="mb-2 text-sm font-semibold text-muted-foreground">Cantidad</p>
        <div className="flex h-12 overflow-hidden rounded-xl border border-[#DFE1E8] bg-white">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="flex w-12 items-center justify-center text-[#0B1A45] transition-colors hover:bg-[#F7F8FA]"
            aria-label="Reducir cantidad"
          >
            <Minus className="h-4.5 w-4.5" />
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
            className="min-w-0 flex-1 border-x border-[#DFE1E8] bg-white text-center text-base font-bold text-foreground outline-none tabular-nums focus:bg-[#F7F8FA]"
          />
          <button
            onClick={() => setQty(q => Math.min(Math.max(1, availableToAdd), q + 1))}
            disabled={qty >= availableToAdd || !canAdd}
            className="flex w-12 items-center justify-center text-[#0B1A45] transition-colors hover:bg-[#F1FFD1] disabled:opacity-40"
            aria-label="Aumentar cantidad"
          >
            <Plus className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#DFE1E8]/80 pt-5">
        <span className="text-sm font-semibold text-muted-foreground">Subtotal</span>
        <span className="font-heading text-2xl font-bold text-[#0B1A45]">{formatCurrency(subtotal)}</span>
      </div>

      {inCart && (
        <p className="mt-3 rounded-xl bg-[#F1FFD1] px-3 py-2 text-center text-xs font-bold text-[#0B1A45]">
          Ya tenés {inCart.quantity} en el carrito
        </p>
      )}

      <Button
        className={`mt-5 h-13 w-full rounded-xl text-base font-bold shadow-[0_14px_26px_rgba(8,15,43,0.16)] transition-all duration-300 ${
          isAdded ? 'bg-green-600 hover:bg-green-600' : 'bg-[#0B1A45] hover:bg-[#142657]'
        }`}
        onClick={handleAddToCart}
        disabled={isAdded || !canAdd}
      >
        {isAdded ? (
          <><CheckCircle2 className="mr-2 h-5 w-5 animate-check-pop" /> Agregado</>
        ) : (
          <><ShoppingCart className="mr-2 h-5 w-5" /> Agregar al carrito</>
        )}
      </Button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        Compra 100% segura
      </div>
    </section>
  )

  const distributorPanel = (
    <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_12px_36px_rgba(11,26,69,0.05)] md:p-6">
      <h2 className="font-heading text-lg font-bold text-foreground">Distribuidora</h2>
      <Link
        href={`/comercio/distribuidora/${distribuidora.id}`}
        className="mt-4 flex items-center gap-3 rounded-2xl border border-[#DFE1E8] bg-[#F7F8FA] p-4 transition-colors hover:bg-white"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B1A45] text-sm font-bold text-white shadow-[0_10px_22px_rgba(8,15,43,0.16)]">
          {distInitials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-foreground">{distribuidora.companyName}</p>
          <p className="text-xs font-medium text-muted-foreground">Distribuidora verificada</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </Link>
      {ratingSummary && ratingSummary.reviewCount > 0 && (
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-white px-1">
          <StarDisplay rating={ratingSummary.averageGeneral} size="sm" showValue />
          <span className="text-xs font-medium text-muted-foreground">{ratingSummary.reviewCount} reseñas</span>
        </div>
      )}
    </section>
  )

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)] pb-10 md:pb-12">
      <div className="mx-auto w-full max-w-[1400px] px-3 py-4 md:px-6 md:py-6">
        <InternalHeaderBackground as="section" className="rounded-3xl px-5 py-5 text-white shadow-[0_18px_52px_rgba(8,15,43,0.14)] md:px-8 md:py-7">
          <div className="relative">
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-white/62">
              <Link href="/comercio" className="hover:text-white">Inicio</Link>
              <span>/</span>
              <Link href={`/comercio/buscar?categoria=${encodeURIComponent(product.category)}`} className="hover:text-white">{product.category}</Link>
              <span>/</span>
              <span className="text-white/86">{product.name}</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-heading text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                  {product.name}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/[0.10] px-3 py-1 text-xs font-bold text-white/84 ring-1 ring-white/[0.14]">
                    {product.category}
                  </span>
                  {isOffer && (
                    <span className="rounded-full border border-lima/40 bg-lima/[0.12] px-3 py-1 text-xs font-bold text-lima">
                      En oferta
                    </span>
                  )}
                </div>
              </div>
              <Link
                href={`/comercio/distribuidora/${distribuidora.id}`}
                className="hidden items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.08] px-4 py-3 text-sm font-bold text-white/84 transition-colors hover:bg-white/[0.12] md:flex"
              >
                <Building2 className="h-4 w-4 text-lima" />
                {distribuidora.companyName}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </InternalHeaderBackground>

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start">
          <div className="space-y-5">
            <section className="overflow-hidden rounded-3xl border border-[#DFE1E8]/80 bg-white p-4 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_16px_48px_rgba(11,26,69,0.06)] md:p-6">
              <div className="flex min-h-[360px] items-center justify-center rounded-[1.4rem] bg-[radial-gradient(circle_at_center,#ffffff_0%,#f7f8fa_58%,#eef1f5_100%)] p-6 md:min-h-[520px]">
                <img
                  src={imageSrc}
                  alt={product.name}
                  className="max-h-[320px] w-full max-w-[560px] object-contain drop-shadow-[0_24px_42px_rgba(8,15,43,0.16)] md:max-h-[470px]"
                />
              </div>
            </section>

            <div className="lg:hidden">
              {purchasePanel}
            </div>

            <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_12px_36px_rgba(11,26,69,0.05)] md:p-7">
              <div className="mb-5 flex items-center gap-2 border-b border-[#DFE1E8]/80 pb-4">
                <Info className="h-4.5 w-4.5 text-[#0B1A45]" />
                <h2 className="font-heading text-lg font-bold text-foreground">Información del producto</h2>
              </div>
              <div className="divide-y divide-[#EEF0F4] text-sm">
                <div className="grid gap-2 py-4 md:grid-cols-[220px_1fr]">
                  <span className="font-medium text-muted-foreground">Descripción</span>
                  <span className="font-medium leading-relaxed text-foreground">{product.description || 'Sin descripción disponible.'}</span>
                </div>
                <div className="grid gap-2 py-4 md:grid-cols-[220px_1fr]">
                  <span className="font-medium text-muted-foreground">Precio</span>
                  <span className="font-bold text-foreground">{formatCurrency(product.price)}</span>
                </div>
                <div className="grid gap-2 py-4 md:grid-cols-[220px_1fr]">
                  <span className="font-medium text-muted-foreground">Stock disponible</span>
                  <span className="font-bold text-foreground">{product.stock} unidades</span>
                </div>
                <div className="grid gap-2 py-4 md:grid-cols-[220px_1fr]">
                  <span className="font-medium text-muted-foreground">En oferta</span>
                  <span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${isOffer ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {isOffer ? 'Sí' : 'No'}
                    </span>
                  </span>
                </div>
              </div>
            </section>

            <div className="lg:hidden">
              {distributorPanel}
            </div>

            <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_12px_36px_rgba(11,26,69,0.05)] md:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Reseñas</p>
                  <h2 className="mt-1 font-heading text-xl font-bold text-foreground">Calificaciones de la distribuidora</h2>
                </div>
                <Link href={`/comercio/distribuidora/${distribuidora.id}`} className="hidden text-sm font-bold text-primary hover:underline md:block">
                  Ver perfil
                </Link>
              </div>

              {reviewsLoading ? (
                <div className="grid gap-4 md:grid-cols-[280px_1fr]">
                  <SkeletonBlock className="h-44 rounded-2xl" />
                  <SkeletonBlock className="h-44 rounded-2xl" />
                </div>
              ) : ratingSummary && ratingSummary.reviewCount > 0 ? (
                <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
                  <div className="rounded-2xl bg-[#F7F8FA] p-5 text-center">
                    <p className="font-heading text-5xl font-bold text-foreground">{ratingSummary.averageGeneral.toFixed(1)}</p>
                    <StarDisplay rating={ratingSummary.averageGeneral} size="md" className="mt-2 justify-center" />
                    <p className="mt-2 text-xs font-medium text-muted-foreground">{ratingSummary.reviewCount} reseñas de comercios</p>
                  </div>
                  <div className="space-y-3">
                    <CriteriaRow label="Cumplimiento" value={ratingSummary.averageFulfillment} />
                    <CriteriaRow label="Entrega" value={ratingSummary.averageDelivery} />
                    <CriteriaRow label="Mercadería" value={ratingSummary.averageProductCondition} />
                    <CriteriaRow label="Atención" value={ratingSummary.averageCommunication} />
                  </div>
                  {reviews.length > 0 && (
                    <div className="space-y-3 lg:col-span-2">
                      {reviews.slice(0, 3).map(review => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#DFE1E8] bg-[#F7F8FA] px-4 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                    <Star className="h-5 w-5 text-amber-400" />
                  </div>
                  <p className="mt-3 font-semibold text-foreground">Todavía no hay reseñas de esta distribuidora</p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    Las reseñas corresponden a pedidos realizados a la distribuidora, no a este producto en particular.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-36">
            <div className="hidden lg:block">
              {purchasePanel}
            </div>

            <div className="hidden lg:block">
              {distributorPanel}
            </div>
          </aside>
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
