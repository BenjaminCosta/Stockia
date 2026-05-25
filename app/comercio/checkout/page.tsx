'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, CreditCard, CheckCircle, Lock, Handshake, Info } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { formatCurrency, getEstimatedDeliveryDate } from '@/lib/mock-data'
import { useDistributor } from '@/hooks/use-data'
import { createOrder } from '@/lib/data/orders.service'
import type { OrderItem } from '@/lib/types'

type PaymentMethod = 'mp' | 'external'

// ─── Confirmation screens ─────────────────────────────────────────────────────

function MpConfirmation() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-2">¡Pedido confirmado!</h1>
      <p className="text-muted-foreground mb-4">Tu pago fue procesado correctamente.</p>
      <p className="text-sm text-gray-400">Redirigiendo a tus pedidos...</p>
    </div>
  )
}

function ExternalConfirmation({ distribuidoraName }: { distribuidoraName: string }) {
  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col items-center justify-center px-6 text-center">
      <div className="h-20 w-20 rounded-full bg-amber-50 flex items-center justify-center mb-6">
        <Handshake className="h-10 w-10 text-amber-500" />
      </div>
      <h1 className="font-heading font-bold text-2xl text-foreground mb-2">
        Pedido enviado a la distribuidora
      </h1>
      <p className="text-gray-500 text-sm max-w-xs mb-6">
        Cuando <span className="font-semibold text-gray-700">{distribuidoraName}</span> confirme el pedido,
        se habilitarán los datos de contacto para coordinar el pago y la entrega.
      </p>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 max-w-xs w-full text-left mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Próximos pasos</p>
        <div className="space-y-3">
          {[
            { step: '1', text: 'La distribuidora revisa stock y condiciones' },
            { step: '2', text: 'Confirma el pedido en la plataforma' },
            { step: '3', text: 'Coordinan pago y entrega por fuera' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-3">
              <div className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {s.step}
              </div>
              <p className="text-sm text-gray-600">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-400">Redirigiendo a tus pedidos...</p>
    </div>
  )
}

// ─── Main checkout ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, clearCart, currentUser } = useApp()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mp')
  const [confirmed, setConfirmed] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  const hasCart = !!cart && cart.items.length > 0

  // Must be called before any early return
  const { data: distribuidora } = useDistributor(cart?.distribuidoraId || '')

  useEffect(() => {
    // Only redirect to carrito when cart is empty AND we haven't confirmed yet.
    // Without this guard, clearCart() would trigger a redirect before the
    // intentional push to /pedidos had a chance to run.
    if (!hasCart && !confirmed) router.push('/comercio/carrito')
  }, [hasCart, confirmed, router])

  if (!hasCart) return null

  const total = getCartTotal()
  const comercio = currentUser as { storeName?: string; address?: string } | null
  const deliveryDate = distribuidora
    ? getEstimatedDeliveryDate((distribuidora as any).deliveryTimeHours)
    : 'Próximos días hábiles'
  const deliveryLabel = distribuidora?.deliveryTimeLabel ?? '48 horas hábiles'

  const handleConfirmar = async () => {
    if (!currentUser || !cart) return
    setIsPlacingOrder(true)
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
        paymentMethod: paymentMethod === 'mp' ? 'mercado_pago' : 'external',
      })
    } catch (err) {
      console.error('[checkout] createOrder failed', err)
    } finally {
      setIsPlacingOrder(false)
    }
    setConfirmed(true)
    setTimeout(() => {
      clearCart()
      router.push('/comercio/pedidos?success=true')
    }, 3000)
  }

  if (confirmed) {
    return paymentMethod === 'mp'
      ? <MpConfirmation />
      : <ExternalConfirmation distribuidoraName={cart.distribuidoraName} />
  }

  const isExternal = paymentMethod === 'external'
  const btnLabel = isExternal
    ? `Enviar pedido a distribuidora`
    : `Confirmar y pagar ${formatCurrency(total)}`

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)] pb-44 md:pb-12">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">

        {/* Header */}
        <header className="mb-5 flex items-center gap-4 md:mb-8">
          <Link href="/comercio/carrito" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-[#DFE1E8] flex items-center justify-center text-[#0B1A45] hover:bg-gray-50 transition-colors active:scale-95 shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Checkout
            </p>
            <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">
              Confirmar pedido
            </h1>
          </div>
          {!isExternal && (
            <div className="ml-auto flex items-center gap-1.5 text-xs md:text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
              <Lock className="h-3.5 w-3.5" /> Pago seguro
            </div>
          )}
        </header>

        <div className="mt-4 grid grid-cols-1 gap-6 md:mt-0 md:grid-cols-12">

          {/* Left column */}
          <div className="md:col-span-7 space-y-6">

            {/* Delivery address */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Dirección de entrega</h2>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-[#F1FFD1] text-[#4A662E] rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-base md:text-lg">{comercio?.storeName || 'Mi comercio'}</p>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    {comercio?.address || 'Av. Mitre 1234, Avellaneda'}
                  </p>
                </div>
              </div>
            </div>

            {/* Estimated delivery */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Entrega estimada</h2>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-base md:text-lg capitalize">{deliveryDate}</p>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    {cart.distribuidoraName} · {deliveryLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Método de pago</h2>
              <div className="space-y-4">
                {/* Mercado Pago */}
                <button
                  onClick={() => setPaymentMethod('mp')}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    paymentMethod === 'mp' ? 'border-primary bg-[#F1FFD1]/50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-base">Mercado Pago</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Pagá con saldo, tarjeta o QR</p>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'mp' ? 'border-primary' : 'border-gray-300'}`}>
                    {paymentMethod === 'mp' && <div className="h-3 w-3 rounded-full bg-primary" />}
                  </div>
                </button>

                {/* Coordinar con distribuidora */}
                <button
                  onClick={() => setPaymentMethod('external')}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                    paymentMethod === 'external' ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                    <Handshake className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-base">Coordinar con distribuidora</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Efectivo, transferencia, cuenta corriente o plazo</p>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'external' ? 'border-amber-400' : 'border-gray-300'}`}>
                    {paymentMethod === 'external' && <div className="h-3 w-3 rounded-full bg-amber-400" />}
                  </div>
                </button>

                {/* Info card when external is selected */}
                {isExternal && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                    <Info className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-800 text-sm">El pedido queda pendiente de confirmación</p>
                      <p className="text-sm text-amber-700 mt-1 leading-relaxed">
                        La distribuidora revisará stock y condiciones. Cuando lo confirme, podrán coordinar el pago y la entrega directamente.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column — order summary */}
          <div className="md:col-span-5">
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8 md:sticky md:top-8">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Resumen del pedido</h2>
              <div className="space-y-3 text-sm md:text-base">
                {cart.items.map(item => (
                  <div key={item.product.id} className="flex justify-between items-start gap-4">
                    <span className="text-muted-foreground">{item.product.name} x{item.quantity}</span>
                    <span className="font-medium shrink-0">{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}

                <div className="border-t border-gray-100 pt-4 mt-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Subtotal</span>
                    <span className="font-medium">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground font-medium">Envío</span>
                    <span className="text-green-600 font-bold">Gratis</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
                    <span className="font-bold text-foreground text-lg">Total</span>
                    <span className="font-heading font-bold text-2xl text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Desktop button */}
              <div className="hidden md:block mt-8">
                <button
                  onClick={handleConfirmar}
                  disabled={isPlacingOrder}
                  className={`w-full h-14 text-base font-bold rounded-xl shadow-lg transition-colors disabled:opacity-70 ${
                    isExternal
                      ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                  }`}
                >
                  {isPlacingOrder ? 'Enviando...' : btnLabel}
                </button>
                {!isExternal && (
                  <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5 font-medium">
                    <Lock className="h-3.5 w-3.5" /> Tu información está cifrada y protegida
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-[0_-8px_30px_-18px_rgba(31,41,55,0.45)]">
        {!isExternal && (
          <p className="text-center text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1.5 font-medium">
            <Lock className="h-3 w-3" /> Tu información está cifrada y protegida
          </p>
        )}
        <button
          onClick={handleConfirmar}
          disabled={isPlacingOrder}
          className={`w-full h-14 text-base font-bold rounded-xl shadow-lg transition-colors disabled:opacity-70 ${
            isExternal
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isPlacingOrder ? 'Enviando...' : btnLabel}
        </button>
      </div>
    </div>
  )
}
