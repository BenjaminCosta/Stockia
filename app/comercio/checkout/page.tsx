'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, CreditCard, CheckCircle, ChevronRight, Lock } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'

export default function CheckoutPage() {
  const router = useRouter()
  const { cart, getCartTotal, clearCart, currentUser } = useApp()
  const [paymentMethod, setPaymentMethod] = useState<'mp' | 'transferencia'>('mp')
  const [confirmed, setConfirmed] = useState(false)

  const hasCart = !!cart && cart.items.length > 0

  useEffect(() => {
    if (!hasCart) {
      router.push('/comercio/carrito')
    }
  }, [hasCart, router])

  if (!hasCart) return null

  const total = getCartTotal()
  const comercio = currentUser as { storeName?: string; address?: string } | null

  const handlePagar = () => {
    setConfirmed(true)
    setTimeout(() => {
      clearCart()
      router.push('/comercio/pedidos?success=true')
    }, 2500)
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="h-20 w-20 md:h-24 md:w-24 rounded-full bg-green-100 flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-green-600" />
        </div>
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 md:mb-4">¡Pedido confirmado!</h1>
        <p className="text-muted-foreground mb-4 md:text-lg">Tu pago fue procesado correctamente.</p>
        <p className="text-sm md:text-base text-gray-500">Redirigiendo a tus pedidos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-44 md:pb-12">
      <div className="max-w-5xl mx-auto md:p-8">

        {/* Header */}
        <div className="bg-white md:bg-transparent px-4 md:px-0 py-4 md:py-0 md:mb-8 sticky top-0 md:static z-30 shadow-sm md:shadow-none flex items-center gap-3">
          <Link href="/comercio/carrito" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-heading font-bold text-xl md:text-3xl text-foreground">Confirmar pago</h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs md:text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full">
            <Lock className="h-3.5 w-3.5" /> Pago seguro
          </div>
        </div>

        {/* Grid */}
        <div className="px-4 md:px-0 mt-4 md:mt-0 grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left column */}
          <div className="md:col-span-7 space-y-6">

            {/* Delivery address */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Dirección de entrega</h2>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-red-50 text-primary rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-base md:text-lg">{comercio?.storeName || 'Mi comercio'}</p>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    {comercio?.address || 'Av. Mitre 1234, Avellaneda'}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Buenos Aires, GBA Sur</p>
                </div>
                <button className="text-sm text-primary font-bold hover:underline shrink-0">Cambiar</button>
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
                  <p className="font-bold text-foreground text-base md:text-lg">Jueves 24 de octubre</p>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    {cart.distribuidoraName} • 48hs hábiles
                  </p>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Método de pago</h2>
              <div className="space-y-4">
                <button
                  onClick={() => setPaymentMethod('mp')}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                    paymentMethod === 'mp' ? 'border-primary bg-red-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-foreground text-base">Mercado Pago</p>
                    <p className="text-sm text-muted-foreground mt-0.5">Pagá con saldo, tarjeta o QR</p>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'mp' ? 'border-primary' : 'border-gray-300'}`}>
                    {paymentMethod === 'mp' && <div className="h-3 w-3 rounded-full bg-primary" />}
                  </div>
                </button>

                <button
                  onClick={() => setPaymentMethod('transferencia')}
                  className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                    paymentMethod === 'transferencia' ? 'border-primary bg-red-50/50' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="h-12 w-12 bg-gray-800 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                    <ChevronRight className="h-6 w-6" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-foreground text-base">Transferencia bancaria</p>
                    <p className="text-sm text-muted-foreground mt-0.5">CBU / CVU del distribuidor</p>
                  </div>
                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 ${paymentMethod === 'transferencia' ? 'border-primary' : 'border-gray-300'}`}>
                    {paymentMethod === 'transferencia' && <div className="h-3 w-3 rounded-full bg-primary" />}
                  </div>
                </button>
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
                  onClick={handlePagar}
                  className="w-full h-14 text-lg font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-red-700 transition-colors"
                >
                  Confirmar y pagar {formatCurrency(total)}
                </button>
                <p className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5 font-medium">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" /> Tu información está cifrada y protegida
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom bar */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 pb-safe shadow-[0_-8px_30px_-18px_rgba(31,41,55,0.45)]">
        <p className="text-center text-xs text-muted-foreground mb-3 flex items-center justify-center gap-1.5 font-medium">
          <Lock className="h-3 w-3 text-muted-foreground" /> Tu información está cifrada y protegida
        </p>
        <button
          onClick={handlePagar}
          className="w-full h-14 text-base font-bold bg-primary text-white rounded-xl shadow-lg hover:bg-red-700 transition-colors"
        >
          Confirmar y pagar {formatCurrency(total)}
        </button>
      </div>
    </div>
  )
}
