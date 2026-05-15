'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, ChevronRight, ShoppingBag } from 'lucide-react'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useDistributors } from '@/hooks/use-data'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { EmptyState } from '@/components/ui/EmptyState'

export default function CarritoPage() {
  const router = useRouter()
  const { cart, removeFromCart, getCartTotal } = useApp()
  const { data: distributors } = useDistributors()
  const [isConfirming, setIsConfirming] = useState(false)

  if (!cart || cart.items.length === 0) {
    return (
      <div className="bg-background">
        <div className="bg-white px-4 md:px-8 py-4 sticky top-16 md:top-20 z-30 border-b border-gray-100 flex items-center gap-4">
          <Link href="/comercio" className="h-9 w-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="font-heading font-bold text-xl text-foreground">Tu Pedido</h1>
        </div>
        <div className="px-4 py-8">
          <EmptyState
            icon={ShoppingBag}
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
  const distributor = distributors.find((item) => item.id === cart.distribuidoraId)
  const minOrder = distributor?.minOrder || 20000
  const minProgress = Math.min((total / minOrder) * 100, 100)
  const remainingToMin = Math.max(minOrder - total, 0)
  const distInitials = cart.distribuidoraName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleConfirm = async () => {
    setIsConfirming(true)
    await new Promise(resolve => setTimeout(resolve, 350))
    router.push('/comercio/checkout')
  }

  return (
    <div className="min-h-screen bg-background pb-44 md:pb-12">
      <div className="max-w-5xl mx-auto md:p-8">

        {/* Header */}
        <div className="bg-white md:bg-transparent px-4 md:px-0 py-4 md:py-0 md:mb-8 sticky top-0 md:static z-30 shadow-sm md:shadow-none flex items-center gap-4">
          <Link href="/comercio" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-heading font-bold text-xl md:text-3xl text-foreground">Tu Pedido</h1>
            <p className="text-sm font-medium text-muted-foreground">
              Carrito · {itemCount} producto{itemCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="px-4 md:px-0 mt-4 md:mt-0 grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left — products */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-sm border border-border">
              <div className="flex justify-between items-end mb-6">
                <h2 className="font-bold text-foreground text-sm uppercase tracking-wide">Productos</h2>
                <span className="text-sm font-medium bg-primary/10 text-primary px-3 py-1 rounded-lg">
                  {itemCount} ítems
                </span>
              </div>

              <div className="space-y-4 md:space-y-6">
                {cart.items.map((item, i) => (
                  <div key={item.product.id}>
                    {i !== 0 && <div className="border-t border-gray-100 mb-4 md:mb-6" />}
                    <div className="flex justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base text-foreground leading-tight">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatCurrency(item.product.price)} x {item.quantity} un.
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-heading font-bold text-lg text-foreground">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-xs md:text-sm text-red-500 font-bold mt-2 flex items-center justify-end w-full hover:underline"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — distributor, payment, summary */}
          <div className="md:col-span-5 space-y-6">

            {/* Distributor */}
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-border">
              <h2 className="font-bold text-foreground mb-4 text-sm uppercase tracking-wide">Distribuidor</h2>
              <div className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <InitialsAvatar
                    initials={distInitials}
                    size="lg"
                    variant="gray"
                    className="group-hover:bg-[#F1FFD1] group-hover:text-[#4A662E] transition-colors"
                  />
                  <div>
                    <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                      {cart.distribuidoraName}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">Llega el Jueves 24 Oct</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-border md:sticky md:top-8">
              <h2 className="hidden md:block font-bold text-foreground mb-6 text-sm uppercase tracking-wide">Resumen</h2>
              <div className="space-y-3 text-base">
                <MinimumOrderProgress
                  total={total}
                  minOrder={minOrder}
                  minProgress={minProgress}
                  remainingToMin={remainingToMin}
                />
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Subtotal ({itemCount} ítems)</span>
                  <span className="font-bold text-foreground">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">Envío</span>
                  <span className="text-green-600 font-bold">Gratis</span>
                </div>
                <div className="border-t border-gray-100 my-4 pt-4" />
                <div className="flex justify-between items-center mb-6">
                  <span className="font-bold text-foreground text-lg">Total a pagar</span>
                  <span className="font-heading font-bold text-2xl text-primary">{formatCurrency(total)}</span>
                </div>
                <LoadingButton
                  className="hidden md:flex w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl"
                  onClick={handleConfirm}
                  loading={isConfirming}
                  loadingLabel="Confirmando pedido"
                >
                  Pagar pedido
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40 shadow-[0_-8px_30px_-18px_rgba(31,41,55,0.45)]">
        <div className="mb-3">
          <MinimumOrderProgress
            total={total}
            minOrder={minOrder}
            minProgress={minProgress}
            remainingToMin={remainingToMin}
            compact
          />
        </div>
        <LoadingButton
          className="w-full h-14 text-lg font-bold shadow-lg rounded-xl"
          onClick={handleConfirm}
          loading={isConfirming}
          loadingLabel="Confirmando pedido"
        >
          Pagar pedido
        </LoadingButton>
      </div>
    </div>
  )
}

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
    <div className={compact ? 'space-y-1.5' : 'rounded-2xl bg-gray-50 p-4 space-y-2'}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Pedido mínimo</span>
        <span className="text-xs font-bold text-foreground">
          {formatCurrency(total)} / {formatCurrency(minOrder)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${minProgress}%` }}
        />
      </div>
      <p className={`text-xs font-medium ${reachedMinimum ? 'text-green-600' : 'text-muted-foreground'}`}>
        {reachedMinimum
          ? 'Mínimo alcanzado'
          : `Faltan ${formatCurrency(remainingToMin)} para alcanzar el mínimo`}
      </p>
    </div>
  )
}
