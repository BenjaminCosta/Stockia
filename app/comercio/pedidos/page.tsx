'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, CheckCircle, Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { PaymentMethodBadge, getPaymentMethodConfig } from '@/components/payment-method-badge'
import { formatCurrency } from '@/lib/mock-data'
import { useApp } from '@/lib/app-context'
import { Order } from '@/lib/types'
import { OrderCardSkeleton } from '@/components/ui/SkeletonCard'
import { StatusBadge } from '@/components/status-badge'

function getOrderStatus(order: Pick<Order, 'status' | 'firestoreStatus'>) {
  return order.firestoreStatus ?? (
    order.status === 'entregado' ? 'delivered' :
    order.status === 'en_preparacion' ? 'preparing' :
    order.status === 'pagado' ? 'confirmed' :
    'pending_confirmation'
  )
}

function isHistoryStatus(status: string) {
  return ['delivered', 'cancelled', 'not_delivered'].includes(status)
}

function formatOrderDate(date: string) {
  return new Date(date).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function PedidosContent() {
  const searchParams = useSearchParams()
  const showSuccess = searchParams.get('success') === 'true'
  const [activeTab, setActiveTab] = useState<'Activos' | 'Historial'>('Activos')
  const { commerceOrders: orders, ordersLoading: isLoading } = useApp()

  const sortedOrders = useMemo(() => [...orders].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ), [orders])

  const activeOrders = useMemo(() => sortedOrders.filter((order) => !isHistoryStatus(getOrderStatus(order))), [sortedOrders])
  const historialOrders = useMemo(() => sortedOrders.filter((order) => isHistoryStatus(getOrderStatus(order))), [sortedOrders])
  const filtered = activeTab === 'Activos' ? activeOrders : historialOrders

  // The most recent active order gets featured treatment
  const featuredOrder = activeTab === 'Activos' && filtered.length > 0 ? filtered[0] : null
  const restOrders = featuredOrder ? filtered.slice(1) : filtered

  return (
    <div className="flex flex-col min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)] pb-20 md:pb-8">
      <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full">
        <header className="mb-5 md:mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pedidos
          </p>
          <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">
            Mis pedidos
          </h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
            Revisá rápido el estado, el tipo de pago y el total de cada compra.
          </p>
        </header>

        {/* Success banner */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-[#F1FFD1] border border-[#89B317]/25 rounded-2xl flex items-center gap-3 shadow-[0_1px_4px_rgba(137,179,23,0.08)]">
            <CheckCircle className="h-5 w-5 text-[#4A662E] shrink-0" />
            <div>
              <p className="font-bold text-[#2d4410] text-sm">Pedido confirmado</p>
              <p className="text-xs text-[#4A662E]">Tu pedido fue enviado a la distribuidora</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-[#F7F8FA] rounded-2xl border border-[#DFE1E8]/80 p-1 flex gap-1 mb-6">
          {(['Activos', 'Historial'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${
                activeTab === tab
                  ? 'bg-[#0B1A45] text-white shadow-sm'
                  : 'text-[#7A839C] hover:text-foreground'
              }`}
            >
              {tab}{tab === 'Activos' && activeOrders.length > 0 && (
                <span className={`ml-2 text-xs font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-[#C8FF00] text-[#0B1A45]' : 'bg-gray-100 text-gray-500'}`}>
                  {activeOrders.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <OrderCardSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay pedidos"
            description={activeTab === 'Activos' ? 'No tenés pedidos activos por ahora.' : 'Tu historial de pedidos aparecerá aquí.'}
            actionLabel={activeTab === 'Activos' ? 'Explorar distribuidoras' : undefined}
            actionHref={activeTab === 'Activos' ? '/comercio/distribuidoras' : undefined}
          />
        ) : (
          <div className="space-y-3">
            {/* Featured most-recent active order */}
            {featuredOrder && (
              <Link href={`/comercio/pedidos/${featuredOrder.id}`} className="block group">
                <article className="overflow-hidden rounded-3xl border border-[#DFE1E8] bg-white p-5 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_10px_24px_rgba(11,26,69,0.06)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#0B1A45]/15 hover:shadow-[0_14px_28px_rgba(11,26,69,0.08)]">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B1A45] font-bold text-white shadow-[0_10px_24px_rgba(11,26,69,0.16)]">
                      {featuredOrder.distribuidoraName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ultimo pedido activo</p>
                          <h2 className="mt-1 truncate font-heading text-xl font-bold text-[#0B1A45]">{featuredOrder.distribuidoraName}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{featuredOrder.orderNumber} · {formatOrderDate(featuredOrder.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2">
                          <span className="font-heading text-2xl font-bold text-[#0B1A45]">{formatCurrency(featuredOrder.total)}</span>
                          <div className="flex flex-wrap gap-2 md:justify-end">
                            <StatusBadge status={getOrderStatus(featuredOrder)} />
                            <PaymentMethodBadge method={featuredOrder.paymentMethod} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#DFE1E8] bg-[#F7F8FA] px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0B1A45]">{featuredOrder.items.length} productos</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{getPaymentMethodConfig(featuredOrder.paymentMethod).detail}</p>
                        </div>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B1A45] text-white transition-transform duration-150 group-hover:translate-x-0.5">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Rest of orders */}
            {restOrders.map(order => (
              <Link key={order.id} href={`/comercio/pedidos/${order.id}`}>
                <article className="cursor-pointer rounded-3xl border border-[#DFE1E8] bg-white p-4 shadow-[0_1px_3px_rgba(11,26,69,0.04)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#0B1A45]/12 hover:shadow-[0_8px_20px_rgba(11,26,69,0.08)] group">
                  <div className="flex items-start gap-3">
                    <InitialsAvatar
                      initials={order.distribuidoraName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                      size="lg"
                      variant="gray"
                      className="rounded-2xl group-hover:bg-[#F1FFD1] group-hover:text-[#4A662E] transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <h3 className="truncate pr-2 text-sm font-bold text-foreground md:text-base">{order.distribuidoraName}</h3>
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {order.orderNumber} · {formatOrderDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-heading text-base font-bold text-foreground md:text-lg">{formatCurrency(order.total)}</span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F7F8FA] text-gray-400 transition-colors duration-150 group-hover:bg-[#0B1A45] group-hover:text-white">
                            <ChevronRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusBadge status={getOrderStatus(order)} />
                        <PaymentMethodBadge method={order.paymentMethod} />
                        <span className="text-xs text-muted-foreground">{order.items.length} productos</span>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground">
                        {getPaymentMethodConfig(order.paymentMethod).detail}
                      </p>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default function PedidosPage() {
  return (
    <Suspense fallback={null}>
      <PedidosContent />
    </Suspense>
  )
}
