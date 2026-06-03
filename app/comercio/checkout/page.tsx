'use client'

import { Fragment, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  AlertTriangle, ArrowLeft, Check, CheckCircle, Clock, CreditCard,
  Handshake, Info, Lock, MapPin,
} from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { formatCurrency, getEstimatedDeliveryDate } from '@/lib/mock-data'
import { useDistributor } from '@/hooks/use-data'
import { createOrder, StockValidationError, type StockValidationIssue } from '@/lib/data/orders.service'
import type { OrderItem } from '@/lib/types'
import { cn } from '@/lib/utils'

type PaymentMethod = 'mp' | 'external'

// ─── Flow step indicator ───────────────────────────────────────────────────────

function FlowSteps({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'Carrito' },
    { n: 2, label: 'Checkout' },
    { n: 3, label: 'Confirmado' },
  ]
  return (
    <div className="flex items-center max-w-[220px]">
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

// ─── Confirmation screens ─────────────────────────────────────────────────────

function MpConfirmation() {
  return (
    <div className="min-h-screen bg-[#080f2b] flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(200,255,0,0.10),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(11,26,69,0.8),transparent_60%)] pointer-events-none" />
      <svg className="absolute inset-0 h-full w-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <circle cx="90%" cy="10%" r="35%" fill="none" stroke="white" strokeWidth="28" />
        <circle cx="10%" cy="90%" r="20%" fill="none" stroke="white" strokeWidth="16" />
      </svg>

      <div className="relative z-10 flex flex-col items-center max-w-sm">
        {/* Icon */}
        <div className="h-24 w-24 rounded-full bg-[#C8FF00]/10 ring-2 ring-[#C8FF00]/25 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(200,255,0,0.15)]">
          <CheckCircle className="h-12 w-12 text-[#C8FF00]" />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C8FF00]/60 mb-3">Pedido confirmado</p>
        <h1 className="font-heading font-bold text-3xl text-white mb-3 leading-tight">
          ¡Tu pedido está en camino!
        </h1>
        <p className="text-white/55 text-sm leading-relaxed mb-2">
          Tu pago fue procesado correctamente. La distribuidora comenzará a prepararlo pronto.
        </p>
        <p className="text-white/30 text-xs">Redirigiendo a tus pedidos...</p>
      </div>
    </div>
  )
}

function ExternalConfirmation({ distribuidoraName }: { distribuidoraName: string }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_60%)] flex flex-col items-center justify-center px-6 text-center">
      {/* Icon */}
      <div className="h-20 w-20 rounded-3xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-6 shadow-sm">
        <Handshake className="h-10 w-10 text-amber-500" />
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-500/70 mb-2">Pedido enviado</p>
      <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-3 leading-tight max-w-sm">
        Esperando confirmación de la distribuidora
      </h1>
      <p className="text-muted-foreground text-sm max-w-xs mb-8 leading-relaxed">
        <span className="font-semibold text-foreground">{distribuidoraName}</span> revisará stock y
        condiciones. Cuando lo confirme, podrán coordinar pago y entrega.
      </p>

      {/* Próximos pasos */}
      <div className="bg-white rounded-3xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] p-6 max-w-xs w-full text-left mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#7A839C] mb-4">Próximos pasos</p>
        <div className="space-y-4">
          {[
            'La distribuidora revisa stock y condiciones',
            'Confirma el pedido en la plataforma',
            'Coordinan pago y entrega directamente',
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary/8 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-muted-foreground leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">Redirigiendo a tus pedidos...</p>
    </div>
  )
}

// ─── Main checkout ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, clearCart, currentUser, removeFromCart, updateCartItemQuantity } = useApp()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mp')
  const [confirmed, setConfirmed] = useState(false)
  const [confirmedDistName, setConfirmedDistName] = useState('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [stockIssues, setStockIssues] = useState<StockValidationIssue[]>([])
  const [orderError, setOrderError] = useState('')

  const hasCart = !!cart && cart.items.length > 0
  const isExternal = paymentMethod === 'external'
  const { data: distribuidora } = useDistributor(cart?.distribuidoraId || '')

  useEffect(() => {
    if (!hasCart && !confirmed) router.push('/comercio/carrito')
  }, [hasCart, confirmed, router])

  if (confirmed) {
    return isExternal
      ? <ExternalConfirmation distribuidoraName={confirmedDistName} />
      : <MpConfirmation />
  }

  if (!hasCart) return null

  const total = getCartTotal()
  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const comercio = currentUser as { storeName?: string; address?: string } | null
  const deliveryDate = distribuidora
    ? getEstimatedDeliveryDate((distribuidora as any).deliveryTimeHours)
    : 'Próximos días hábiles'
  const deliveryLabel = distribuidora?.deliveryTimeLabel ?? '48 horas hábiles'

  const handleConfirmar = async () => {
    if (!currentUser || !cart) return
    setIsPlacingOrder(true)
    setStockIssues([])
    setOrderError('')
    const subtotal = getCartTotal()
    const items: OrderItem[] = cart.items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
    }))
    try {
      await createOrder({
        commerceId: currentUser.id,
        distributorId: cart.distribuidoraId,
        items,
        subtotal,
        total: subtotal,
        paymentMethod: isExternal ? 'external' : 'mercado_pago',
      })

      setConfirmedDistName(cart.distribuidoraName)
      setConfirmed(true)
      setTimeout(() => {
        router.push('/comercio/pedidos?success=true')
        clearCart()
      }, 1500)
    } catch (err) {
      console.error('[checkout] createOrder failed', err)
      const issues = err instanceof StockValidationError || (err as any)?.name === 'StockValidationError'
        ? (err as StockValidationError).issues
        : []

      if (issues.length > 0) {
        setStockIssues(issues)
        issues.forEach(issue => {
          if (issue.available <= 0) {
            removeFromCart(issue.productId)
          } else {
            updateCartItemQuantity(issue.productId, issue.available)
          }
        })
      } else {
        setOrderError('No pudimos confirmar el pedido. Revisá tu conexión e intentá de nuevo.')
      }
    } finally {
      setIsPlacingOrder(false)
    }
  }

  const btnLabel = isExternal
    ? 'Enviar pedido a la distribuidora'
    : `Confirmar y pagar ${formatCurrency(total)}`

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)] pb-44 md:pb-12">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">

        {/* Header */}
        <header className="mb-5 md:mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/comercio/carrito"
              className="h-10 w-10 rounded-full bg-white border border-[#DFE1E8] flex items-center justify-center text-[#0B1A45] hover:bg-gray-50 transition-colors active:scale-95 shadow-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Pedido</p>
              <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">Checkout</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isExternal && (
              <span className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-[#4A662E] bg-[#F1FFD1] border border-[#89B317]/25 px-3 py-1.5 rounded-full">
                <Lock className="h-3 w-3" /> Pago seguro
              </span>
            )}
            <FlowSteps step={2} />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">

          {/* Left column */}
          <div className="md:col-span-7 space-y-5">

            {/* Dirección de entrega */}
            <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 p-5 md:p-6">
              <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C] mb-4">Dirección de entrega</h2>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-[#F1FFD1] text-[#4A662E] rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">{comercio?.storeName || 'Mi comercio'}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {comercio?.address || 'Actualizá tu dirección en Cuenta'}
                  </p>
                </div>
              </div>
            </div>

            {/* Entrega estimada */}
            <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 p-5 md:p-6">
              <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C] mb-4">Entrega estimada</h2>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm capitalize">{deliveryDate}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {cart.distribuidoraName} · {deliveryLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 p-5 md:p-6">
              <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C] mb-4">Método de pago</h2>
              <div className="space-y-3">

                {/* Mercado Pago */}
                <button
                  onClick={() => setPaymentMethod('mp')}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                    paymentMethod === 'mp'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div className="h-11 w-11 bg-[#009EE3] rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-foreground text-sm">Mercado Pago</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Saldo, tarjeta o QR</p>
                  </div>
                  <div className={cn(
                    'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    paymentMethod === 'mp' ? 'border-primary' : 'border-gray-300'
                  )}>
                    {paymentMethod === 'mp' && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>
                </button>

                {/* Coordinar con distribuidora */}
                <button
                  onClick={() => setPaymentMethod('external')}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left',
                    paymentMethod === 'external'
                      ? 'border-amber-400 bg-amber-50/60'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div className="h-11 w-11 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Handshake className="h-5 w-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-foreground text-sm">Coordinar con distribuidora</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Efectivo, transferencia, cuenta corriente</p>
                  </div>
                  <div className={cn(
                    'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    paymentMethod === 'external' ? 'border-amber-400' : 'border-gray-300'
                  )}>
                    {paymentMethod === 'external' && <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />}
                  </div>
                </button>

                {/* Aviso external */}
                {isExternal && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200/80 rounded-2xl">
                    <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 text-xs">Pedido pendiente de confirmación</p>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        La distribuidora revisará stock y condiciones. Cuando lo confirme, los datos de contacto quedarán disponibles para coordinar el pago.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column — resumen */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 p-5 md:p-6 md:sticky md:top-8">
              <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C] mb-4">Resumen del pedido</h2>

              {stockIssues.length > 0 && (
                <div className="mb-4 rounded-2xl border border-amber-200/80 bg-amber-50 p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Revisá el stock disponible</p>
                      <div className="mt-2 space-y-1">
                        {stockIssues.map(issue => (
                          <p key={issue.productId} className="text-xs text-amber-800">
                            {issue.productName}: pediste {issue.requested}, disponible {issue.available}.
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {orderError && (
                <div className="mb-4 rounded-2xl border border-red-200/80 bg-red-50 p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    <p className="text-xs font-semibold text-red-700">{orderError}</p>
                  </div>
                </div>
              )}

              {/* Distribuidora */}
              <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-gray-100">
                <div className="h-8 w-8 rounded-lg bg-[#F7F8FA] border border-[#DFE1E8] flex items-center justify-center font-bold text-[#0B1A45] text-xs shrink-0">
                  {cart.distribuidoraName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <p className="font-semibold text-sm text-foreground">{cart.distribuidoraName}</p>
              </div>

              <div className="space-y-2 text-sm mb-4">
                {cart.items.map(item => (
                  <div key={item.product.id} className="flex justify-between items-start gap-3">
                    <span className="text-muted-foreground leading-snug">
                      {item.product.name}
                      <span className="ml-1 font-medium text-foreground/60">×{item.quantity}</span>
                    </span>
                    <span className="font-semibold shrink-0">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Subtotal ({itemCount} {itemCount === 1 ? 'ítem' : 'ítems'})</span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-medium">Envío</span>
                  <span className="text-[#4A662E] font-bold">Gratis</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-heading font-bold text-2xl text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Desktop button */}
              <div className="hidden md:block mt-6 space-y-3">
                <button
                  onClick={handleConfirmar}
                  disabled={isPlacingOrder}
                  className={cn(
                    'w-full h-13 text-sm font-bold rounded-xl shadow-lg transition-[background-color,transform] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
                    isExternal
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                  )}
                >
                  {isPlacingOrder ? 'Procesando...' : btnLabel}
                </button>
                {!isExternal && (
                  <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <Lock className="h-3 w-3" /> Tu información está cifrada y protegida
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile — barra fija */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 bg-white border-t border-gray-100 p-4 z-40 shadow-[0_-6px_24px_rgba(11,26,69,0.07)] space-y-2">
        {!isExternal && (
          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3" /> Tu información está cifrada y protegida
          </p>
        )}
        <button
          onClick={handleConfirmar}
          disabled={isPlacingOrder}
          className={cn(
            'w-full h-13 text-sm font-bold rounded-xl shadow-lg transition-[background-color,transform] active:scale-[0.98] disabled:opacity-60',
            isExternal
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-primary text-white hover:bg-primary/90'
          )}
        >
          {isPlacingOrder ? 'Procesando...' : btnLabel}
        </button>
      </div>
    </div>
  )
}
