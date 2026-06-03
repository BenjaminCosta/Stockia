'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, CheckCircle, Package, Check } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { PaymentMethodBadge, getPaymentMethodConfig } from '@/components/payment-method-badge'
import { formatCurrency } from '@/lib/mock-data'
import { useApp } from '@/lib/app-context'
import { Order } from '@/lib/types'
import { OrderCardSkeleton } from '@/components/ui/SkeletonCard'
import { StatusBadge } from '@/components/status-badge'
import { cn } from '@/lib/utils'

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

function formatOrderShortDate(date: string) {
  const d = new Date(date)
  const day = d.getDate()
  const month = d.toLocaleDateString('es-AR', { month: 'short' })
  const time = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  return `${day} ${month} · ${time} hs`
}

function getInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
}

// Maps a firestoreStatus to a 0-based step index (0=created, 1=preparing, 2=on_the_way, 3=delivered)
function getTimelineStep(status: string): number {
  if (status === 'delivered') return 3
  if (status === 'ready_or_on_the_way') return 2
  if (status === 'preparing' || status === 'confirmed') return 1
  return 0
}

const timelineSteps = ['Pedido creado', 'En preparación', 'En camino', 'Entregado']

function OrderTimeline({ status, createdAt, updatedAt }: { status: string; createdAt: string; updatedAt: string }) {
  const currentStep = getTimelineStep(status)

  return (
    <div className="flex items-start gap-0 w-full">
      {timelineSteps.map((label, i) => {
        const isDone = i < currentStep
        const isActive = i === currentStep
        const isLast = i === timelineSteps.length - 1

        return (
          <div key={label} className="flex-1 flex flex-col items-center min-w-0">
            <div className="flex items-center w-full">
              {/* Left connector */}
              <div className={cn(
                'flex-1 h-[2px]',
                i === 0 ? 'invisible' : isDone || isActive ? 'bg-[#4A662E]' : 'bg-[#DFE1E8]',
                i > 0 && (isDone ? 'bg-[#4A662E]' : i === currentStep ? 'bg-gradient-to-r from-[#4A662E] to-[#DFE1E8]' : 'bg-[#DFE1E8]')
              )} />
              {/* Circle */}
              <div className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-all',
                isDone
                  ? 'bg-[#4A662E] border-[#4A662E]'
                  : isActive
                    ? 'bg-white border-[#4A662E] shadow-[0_0_0_3px_rgba(74,102,46,0.12)]'
                    : 'bg-white border-[#DFE1E8]'
              )}>
                {isDone ? (
                  <Check className="h-3 w-3 text-white stroke-[3]" />
                ) : isActive ? (
                  <div className="h-2.5 w-2.5 rounded-full bg-[#4A662E]" />
                ) : null}
              </div>
              {/* Right connector */}
              <div className={cn(
                'flex-1 h-[2px]',
                isLast ? 'invisible' : isDone ? 'bg-[#4A662E]' : 'bg-[#DFE1E8]'
              )} />
            </div>
            {/* Label */}
            <p className={cn(
              'mt-1.5 text-center text-[10px] font-semibold leading-tight px-0.5',
              isDone || isActive ? 'text-[#4A662E]' : 'text-[#B0B8CC]'
            )}>
              {label}
            </p>
            {isActive && (
              <p className="mt-0.5 text-[9px] text-[#7A839C] text-center">
                {formatOrderShortDate(updatedAt)}
              </p>
            )}
            {isDone && i === 0 && (
              <p className="mt-0.5 text-[9px] text-[#7A839C] text-center">
                {formatOrderShortDate(createdAt)}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
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
      <main className="flex-1 px-4 py-5 md:px-8 md:py-7 max-w-5xl mx-auto w-full">

        {/* Compact page header */}
        <div className="mb-4 md:mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#7A839C]">Pedidos / Mis pedidos</p>
          <h1 className="mt-0.5 font-heading text-2xl font-bold tracking-tight text-[#0B1A45] md:text-3xl">Mis pedidos</h1>
        </div>

        {/* Success banner */}
        {showSuccess && (
          <div className="mb-4 p-3.5 bg-[#F1FFD1] border border-[#89B317]/25 rounded-2xl flex items-center gap-3 shadow-[0_1px_4px_rgba(137,179,23,0.08)]">
            <CheckCircle className="h-4.5 w-4.5 text-[#4A662E] shrink-0" />
            <div>
              <p className="font-bold text-[#2d4410] text-sm">Pedido confirmado</p>
              <p className="text-xs text-[#4A662E]">Tu pedido fue enviado a la distribuidora</p>
            </div>
          </div>
        )}

        {/* Segmented control tabs */}
        <div className="flex items-center gap-1 mb-5">
          <div className="bg-[#F0F1F5] rounded-xl p-0.5 flex gap-0.5 inline-flex">
            {(['Activos', 'Historial'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-1.5 rounded-[10px] text-sm font-semibold transition-all duration-150 flex items-center gap-1.5',
                  activeTab === tab
                    ? 'bg-white text-[#0B1A45] shadow-sm'
                    : 'text-[#7A839C] hover:text-[#0B1A45]'
                )}
              >
                {tab}
                {tab === 'Activos' && activeOrders.length > 0 && (
                  <span className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none',
                    activeTab === tab ? 'bg-[#C8FF00] text-[#0B1A45]' : 'bg-[#DFE1E8] text-[#7A839C]'
                  )}>
                    {activeOrders.length}
                  </span>
                )}
              </button>
            ))}
          </div>
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
          <div className="space-y-2.5">
            {/* Featured most-recent active order */}
            {featuredOrder && (() => {
              const fStatus = getOrderStatus(featuredOrder)
              return (
                <article className="overflow-hidden rounded-2xl border border-[#DFE1E8] bg-white shadow-[0_2px_8px_rgba(11,26,69,0.06),0_12px_28px_rgba(11,26,69,0.07)]">
                  <div className="p-4 md:p-5">
                    {/* Row 1: avatar + name/code + total */}
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B1A45] text-sm font-bold text-white shadow-[0_6px_18px_rgba(11,26,69,0.2)]">
                        {getInitials(featuredOrder.distribuidoraName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-heading text-base md:text-lg font-bold text-[#0B1A45] leading-tight truncate">{featuredOrder.distribuidoraName}</h2>
                        <p className="mt-0.5 text-xs text-[#7A839C]">{featuredOrder.orderNumber} · {formatOrderShortDate(featuredOrder.createdAt)}</p>
                      </div>
                      <p className="font-heading text-xl md:text-2xl font-bold text-[#0B1A45] leading-none shrink-0">{formatCurrency(featuredOrder.total)}</p>
                    </div>

                    {/* Row 2: badges + products + payment — always on its own line */}
                    <div className="mt-3 flex items-center flex-wrap gap-1.5">
                      <StatusBadge status={fStatus} />
                      <PaymentMethodBadge method={featuredOrder.paymentMethod} />
                      <span className="text-[#DFE1E8] mx-0.5">·</span>
                      <span className="text-xs font-semibold text-[#0B1A45]">{featuredOrder.items.length} productos</span>
                      <span className="text-[#DFE1E8] mx-0.5 hidden sm:inline">·</span>
                      <span className="text-xs text-[#7A839C] hidden sm:inline">{getPaymentMethodConfig(featuredOrder.paymentMethod).detail}</span>
                    </div>
                    {/* Payment detail — mobile only, own line */}
                    <p className="mt-1 text-xs text-[#7A839C] sm:hidden">{getPaymentMethodConfig(featuredOrder.paymentMethod).detail}</p>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-[#F0F1F5]" />

                  {/* Timeline + CTA — stacked on mobile, side-by-side on md+ */}
                  <div className="px-4 md:px-5 py-4 flex flex-col md:flex-row md:items-end gap-4">
                    <div className="flex-1 min-w-0">
                      <OrderTimeline
                        status={fStatus}
                        createdAt={featuredOrder.createdAt}
                        updatedAt={featuredOrder.updatedAt}
                      />
                    </div>
                    <Link
                      href={`/comercio/pedidos/${featuredOrder.id}`}
                      className="w-full md:w-auto shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B1A45] px-5 py-2.5 text-sm font-bold text-white transition-[transform,background-color] duration-150 hover:bg-[#142657] active:scale-[0.97]"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </article>
              )
            })()}

            {/* Rest of orders — compact list */}
            {restOrders.length > 0 && (
              <div className="rounded-2xl border border-[#DFE1E8] bg-white shadow-[0_1px_3px_rgba(11,26,69,0.04)] overflow-hidden divide-y divide-[#F0F1F5]">
                {restOrders.map(order => (
                  <Link key={order.id} href={`/comercio/pedidos/${order.id}`} className="group block">
                    <div className="flex items-center gap-3 px-4 py-4 transition-colors duration-150 hover:bg-[#F7F8FA]">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F1F5] text-xs font-bold text-[#7A839C] group-hover:bg-[#E8F5D0] group-hover:text-[#4A662E] transition-colors">
                        {getInitials(order.distribuidoraName)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0B1A45] truncate">{order.distribuidoraName}</p>
                        <p className="text-xs text-[#7A839C] mt-0.5">{order.orderNumber} · {formatOrderShortDate(order.createdAt)}</p>
                      </div>

                      {/* Amount + badges + products + arrow */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="font-heading text-base font-bold text-[#0B1A45]">{formatCurrency(order.total)}</span>
                        <div className="hidden sm:flex items-center gap-1.5">
                          <StatusBadge status={getOrderStatus(order)} />
                          <PaymentMethodBadge method={order.paymentMethod} />
                        </div>
                        <span className="hidden md:block text-xs text-[#7A839C]">{order.items.length} productos</span>
                        <ChevronRight className="h-4 w-4 text-[#B0B8CC] group-hover:text-[#0B1A45] transition-colors" />
                      </div>
                    </div>
                    {/* Mobile-only badges row */}
                    <div className="flex sm:hidden items-center flex-wrap gap-1.5 px-4 pb-3.5 -mt-1">
                      <StatusBadge status={getOrderStatus(order)} />
                      <PaymentMethodBadge method={order.paymentMethod} />
                      <span className="text-xs text-[#7A839C] ml-0.5">{order.items.length} productos</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Count footer */}
            <p className="text-center text-xs text-[#B0B8CC] pt-1">
              Mostrando {filtered.length} de {filtered.length} pedido{filtered.length !== 1 ? 's' : ''} {activeTab === 'Activos' ? 'activos' : 'en historial'}
            </p>
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
