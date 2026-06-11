'use client'

import { Fragment, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Check, ChevronRight, ShoppingBag, Trash2 } from 'lucide-react'
import { ComercioPageHeader } from '@/components/comercio-page-header'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useDistributors, useProducts } from '@/hooks/use-data'
import type { Comercio } from '@/lib/types'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { QuantityStepper } from '@/components/quantity-stepper'
import { cn } from '@/lib/utils'

// ─── Flow step indicator ───────────────────────────────────────────────────────

function FlowSteps({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Carrito' },
    { n: 2, label: 'Checkout' },
    { n: 3, label: 'Confirmado' },
  ]
  return (
    <div className="flex items-center max-w-55">
      {steps.map((s, i) => (
        <Fragment key={s.n}>
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              'h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors',
              s.n < step  ? 'bg-primary text-white' :
              s.n === step ? 'bg-primary text-white ring-4 ring-primary/15' :
              'bg-gray-100 text-gray-400'
            )}>
              {s.n < step ? <Check className="h-3 w-3" /> : s.n}
            </div>
            <span className={cn(
              'text-[9px] font-semibold whitespace-nowrap',
              s.n === step ? 'text-primary' : s.n < step ? 'text-foreground' : 'text-gray-400'
            )}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('flex-1 h-px mx-1.5 mb-3.5', s.n < step ? 'bg-primary' : 'bg-gray-200')} />
          )}
        </Fragment>
      ))}
    </div>
  )
}

// ─── Minimum order progress ────────────────────────────────────────────────────

function MinimumOrderProgress({
  total,
  minOrder,
  minProgress,
  remainingToMin,
  compact = false,
}: {
  total: number
  minOrder: number
  minProgress: number
  remainingToMin: number
  compact?: boolean
}) {
  const reachedMinimum = remainingToMin === 0

  return (
    <div className={compact ? 'space-y-1.5' : 'rounded-2xl bg-[#F7F8FA] border border-[#DFE1E8]/60 p-4 space-y-2'}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A839C]">Pedido mínimo</span>
        <span className="text-xs font-bold text-foreground">
          {formatCurrency(total)} / {formatCurrency(minOrder)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#DFE1E8]">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${reachedMinimum ? 'bg-[#89B317]' : 'bg-[#0B1A45]'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)', width: `${minProgress}%` }}
        />
      </div>
      <p className={`text-xs font-medium ${reachedMinimum ? 'text-[#4A662E]' : 'text-[#7A839C]'}`}>
        {reachedMinimum
          ? '¡Mínimo alcanzado!'
          : `Faltan ${formatCurrency(remainingToMin)} para el mínimo`}
      </p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CarritoPage() {
  const router = useRouter()
  const { cart, removeFromCart, getCartTotal, updateCartItemQuantity, currentUser } = useApp()
  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const loc = comercio?.location
  const commerceContext = loc
    ? { lat: loc.lat ?? undefined, lng: loc.lng ?? undefined, locationKey: loc.locationKey, citySlug: loc.citySlug, provinceSlug: loc.provinceSlug, isInternalTest: comercio?.isInternalTest === true }
    : undefined
  const { data: distributors } = useDistributors()
  const { data: zoneDistributors, loading: zoneLoading } = useDistributors(commerceContext)
  const { data: distributorProducts, loading: productsLoading } = useProducts(cart?.distribuidoraId)
  const [isConfirming, setIsConfirming] = useState(false)

  const productById = useMemo(
    () => new Map(distributorProducts.map(product => [product.id, product])),
    [distributorProducts]
  )

  const stockIssues = useMemo(() => {
    if (!cart || productsLoading) return []

    return cart.items.flatMap(item => {
      const currentProduct = productById.get(item.product.id)
      const available = currentProduct?.status === 'active' ? currentProduct.stock : 0

      if (!currentProduct || item.quantity > available) {
        return [{
          productId: item.product.id,
          productName: currentProduct?.name ?? item.product.name,
          requested: item.quantity,
          available,
        }]
      }

      return []
    })
  }, [cart, productById, productsLoading])

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <ComercioPageHeader label="Pedido" title="Carrito" />
          <EmptyState
            icon={ShoppingBag}
            imageSrc="/assets/carrito-3d.png"
            imageClassName="h-36 w-52 md:h-52 md:w-72"
            title="Tu carrito está vacío"
            description="Explorá las distribuidoras y sumá productos para armar tu pedido"
            actionLabel="Explorar distribuidoras"
            actionHref="/comercio"
          />
        </div>
      </div>
    )
  }

  const total = getCartTotal()
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const distributor = distributors.find(d => d.id === cart.distribuidoraId)
  const minOrder = distributor?.minOrder ?? 20000
  const minProgress = Math.min((total / minOrder) * 100, 100)
  const remainingToMin = Math.max(minOrder - total, 0)
  const hasStockIssues = stockIssues.length > 0
  const isOutOfZone = !!commerceContext && !zoneLoading && !zoneDistributors.some(d => d.id === cart.distribuidoraId)
  const distInitials = cart.distribuidoraName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleConfirm = async () => {
    if (hasStockIssues || productsLoading) return
    setIsConfirming(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    router.push('/comercio/checkout')
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)] pb-10 md:pb-12">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">

        <ComercioPageHeader
          label="Pedido"
          title="Carrito"
          actions={<FlowSteps step={1} />}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">

          {/* Left — productos */}
          <div className="md:col-span-7 space-y-4">

            {/* Distribuidor */}
            <Link
              href={`/comercio/distribuidora/${cart.distribuidoraId}`}
              className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.04)] px-4 py-3.5 hover:border-primary/20 hover:shadow-[0_4px_14px_rgba(11,26,69,0.08)] transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#F7F8FA] border border-[#DFE1E8] flex items-center justify-center font-bold text-[#0B1A45] text-sm shrink-0 group-hover:bg-[#F1FFD1] group-hover:text-[#4A662E] transition-colors">
                  {distInitials}
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Distribuidora</p>
                  <p className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{cart.distribuidoraName}</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors shrink-0" />
            </Link>

            {/* Productos */}
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C]">Productos</h2>
                <span className="text-xs font-semibold bg-[#F7F8FA] text-[#0B1A45] border border-[#DFE1E8]/60 px-2.5 py-1 rounded-lg">
                  {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
                </span>
              </div>

              <div className="space-y-5">
                {cart.items.map((item, i) => {
                  const currentProduct = productById.get(item.product.id) ?? item.product
                  const available = currentProduct.status === 'active' ? currentProduct.stock : 0
                  const hasIssue = !productsLoading && item.quantity > available

                  return (
                    <div key={item.product.id}>
                      {i !== 0 && <div className="border-t border-gray-100 mb-5" />}
                      <div className="flex justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground leading-tight">{currentProduct.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatCurrency(currentProduct.price)} c/u
                          </p>
                          {hasIssue && (
                            <p className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-700">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Stock disponible: {available} un.
                            </p>
                          )}
                          <div className="mt-2.5 flex items-center gap-3">
                            <QuantityStepper
                              value={item.quantity}
                              onChange={v => updateCartItemQuantity(item.product.id, v)}
                              min={1}
                              max={Math.max(1, available)}
                              disabled={available <= 0}
                            />
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="flex items-center gap-1 text-xs text-red-400 font-semibold hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" /> Eliminar
                            </button>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-heading font-bold text-base text-foreground">
                            {formatCurrency(currentProduct.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right — resumen */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 md:sticky md:top-8 space-y-4">
              <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C]">Resumen</h2>

              <MinimumOrderProgress
                total={total}
                minOrder={minOrder}
                minProgress={minProgress}
                remainingToMin={remainingToMin}
              />

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Subtotal ({itemCount} {itemCount === 1 ? 'ítem' : 'ítems'})</span>
                  <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Envío</span>
                  <span className="text-[#4A662E] font-bold">Gratis</span>
                </div>
                <div className="border-t border-gray-100 pt-3 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="font-heading font-bold text-2xl text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {isOutOfZone && (
                <div className="flex items-start gap-2.5 rounded-2xl border border-red-200/80 bg-red-50 p-3.5">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-xs font-semibold text-red-700">
                    Esta distribuidora no realiza envíos a tu zona.
                  </p>
                </div>
              )}

              <LoadingButton
                className="w-full h-13 text-base font-bold shadow-lg shadow-primary/15 rounded-xl"
                onClick={handleConfirm}
                loading={isConfirming}
                loadingLabel="Un momento..."
                disabled={remainingToMin > 0 || hasStockIssues || productsLoading || isOutOfZone}
              >
                Ir al checkout →
              </LoadingButton>

              {isOutOfZone ? (
                <p className="text-xs text-center text-red-600 font-semibold">
                  No podés completar el pedido con esta distribuidora
                </p>
              ) : hasStockIssues ? (
                <p className="text-xs text-center text-amber-700">
                  Ajustá las cantidades sin stock para continuar
                </p>
              ) : remainingToMin > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  Agregá {formatCurrency(remainingToMin)} más para continuar
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
