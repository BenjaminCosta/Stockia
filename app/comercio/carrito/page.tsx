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
import { QuantityStepper } from '@/components/quantity-stepper'

export default function CarritoPage() {
  const router = useRouter()
  const { cart, removeFromCart, getCartTotal, updateCartItemQuantity } = useApp()
  const { data: distributors } = useDistributors()
  const [isConfirming, setIsConfirming] = useState(false)

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <header className="mb-8 flex items-center gap-4">
            <Link href="/comercio" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-[#DFE1E8] flex items-center justify-center text-[#0B1A45] hover:bg-gray-50 transition-colors duration-150 active:scale-95 shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Pedido actual
              </p>
              <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">
                Carrito
              </h1>
            </div>
          </header>
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)] pb-44 md:pb-12">
      <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">

        {/* Header */}
        <header className="mb-5 flex items-center gap-4 md:mb-8">
          <Link href="/comercio" className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-[#DFE1E8] flex items-center justify-center text-[#0B1A45] hover:bg-gray-50 transition-colors duration-150 active:scale-95 shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Pedido actual
            </p>
            <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">
              Carrito
            </h1>
          </div>
        </header>

        <div className="mt-4 grid grid-cols-1 gap-6 md:mt-0 md:grid-cols-12">

          {/* Left — products */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white rounded-3xl p-5 md:p-8 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80">
              <div className="flex justify-between items-end mb-6">
                <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C]">Productos</h2>
                <span className="text-xs font-semibold bg-[#0B1A45]/8 text-[#0B1A45] px-3 py-1 rounded-lg">
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
                          {formatCurrency(item.product.price)} · unidad
                        </p>
                        <div className="mt-2.5 flex items-center gap-3">
                          <QuantityStepper
                            value={item.quantity}
                            onChange={v => updateCartItemQuantity(item.product.id, v)}
                            min={1}
                          />
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-xs text-red-400 font-semibold hover:text-red-600 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Eliminar
                          </button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-heading font-bold text-lg text-foreground">
                          {formatCurrency(item.product.price * item.quantity)}
                        </p>
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
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80">
              <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C] mb-4">Distribuidor</h2>
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
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 md:sticky md:top-8">
              <h2 className="hidden md:block font-bold text-xs uppercase tracking-widest text-[#7A839C] mb-6">Resumen</h2>
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
      <div className="md:hidden fixed bottom-20 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40 shadow-[0_-4px_12px_rgba(11,26,69,0.06)]">
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
    <div className={compact ? 'space-y-1.5' : 'rounded-2xl bg-[#F7F8FA] border border-[#DFE1E8]/60 p-4 space-y-2'}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A839C]">Pedido mínimo</span>
        <span className="text-xs font-bold text-foreground">
          {formatCurrency(total)} / {formatCurrency(minOrder)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#DFE1E8]">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${reachedMinimum ? 'bg-[#89B317]' : 'bg-[#0B1A45]'}`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)', width: `${minProgress}%` }}
        />
      </div>
      <p className={`text-xs font-medium ${reachedMinimum ? 'text-[#4A662E]' : 'text-[#7A839C]'}`}>
        {reachedMinimum
          ? 'Mínimo alcanzado'
          : `Faltan ${formatCurrency(remainingToMin)} para alcanzar el mínimo`}
      </p>
    </div>
  )
}
