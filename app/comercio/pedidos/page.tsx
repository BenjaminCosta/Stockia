'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, CheckCircle, Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { formatCurrency } from '@/lib/mock-data'
import { useApp } from '@/lib/app-context'
import { useComercioOrders } from '@/hooks/use-data'
import { Comercio, OrderStatus } from '@/lib/types'
import { OrderCardSkeleton } from '@/components/ui/SkeletonCard'
import { StatusBadge } from '@/components/status-badge'

function PedidosContent() {
  const searchParams = useSearchParams()
  const showSuccess = searchParams.get('success') === 'true'
  const { currentUser } = useApp()
  const [activeTab, setActiveTab] = useState<'Activos' | 'Historial'>('Activos')

  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const { data: orders, loading: isLoading } = useComercioOrders(comercio?.id || 'com-1')

  const activeOrders = orders.filter(o => o.status !== 'entregado')
  const historialOrders = orders.filter(o => o.status === 'entregado')
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
            actionHref={activeTab === 'Activos' ? '/comercio' : undefined}
          />
        ) : (
          <div className="space-y-3">
            {/* Featured most-recent active order */}
            {featuredOrder && (
              <Link href={`/comercio/pedidos/${featuredOrder.id}`}>
                <div className="bg-[#080f2b] rounded-2xl md:rounded-3xl p-4 md:p-6 relative overflow-hidden cursor-pointer group transition-opacity duration-150 active:opacity-90">
                  {/* Radial glow */}
                  <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#0B1A45]/60 blur-2xl pointer-events-none" />
                  {/* Geometric overlay */}
                  <svg className="absolute inset-0 h-full w-full opacity-[0.045]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                    <circle cx="92%" cy="-5%" r="38%" fill="none" stroke="white" strokeWidth="30" />
                    <line x1="0" y1="100%" x2="100%" y2="0" stroke="white" strokeWidth="0.6" />
                    <circle cx="20%" cy="80%" r="1.5" fill="white" opacity="0.5" />
                    <circle cx="50%" cy="30%" r="1" fill="white" opacity="0.3" />
                  </svg>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3 md:mb-4">
                      <StatusBadge status={featuredOrder.status} />
                      <span className="text-white/40 text-xs font-mono font-medium">{featuredOrder.orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-4 md:mb-5">
                      <div className="h-10 w-10 md:h-12 md:w-12 bg-[#C8FF00]/15 rounded-xl md:rounded-2xl flex items-center justify-center font-bold text-[#C8FF00] text-xs md:text-sm shrink-0">
                        {featuredOrder.distribuidoraName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white/50 text-[10px] font-medium mb-0.5">Distribuidor</p>
                        <h3 className="font-bold text-white text-base md:text-lg leading-tight">{featuredOrder.distribuidoraName}</h3>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 md:pt-4 border-t border-white/10">
                      <p className="text-white/50 text-xs font-medium">{featuredOrder.items.length} productos · {new Date(featuredOrder.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-xl md:text-2xl text-white">{formatCurrency(featuredOrder.total)}</span>
                        <div className="h-7 w-7 md:h-8 md:w-8 bg-[#C8FF00] rounded-lg md:rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-150">
                          <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#0B1A45]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Rest of orders */}
            {restOrders.map(order => (
              <Link key={order.id} href={`/comercio/pedidos/${order.id}`}>
                <div className="bg-white rounded-xl md:rounded-2xl p-4 border border-[#DFE1E8] shadow-[0_1px_3px_rgba(11,26,69,0.04)] hover:shadow-[0_4px_14px_rgba(11,26,69,0.08)] hover:border-[#0B1A45]/12 transition-[border-color,box-shadow] duration-200 cursor-pointer flex items-center gap-3 group">
                  <InitialsAvatar
                    initials={order.distribuidoraName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                    size="lg"
                    variant="gray"
                    className="rounded-2xl group-hover:bg-[#F1FFD1] group-hover:text-[#4A662E] transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h3 className="font-bold text-foreground text-sm md:text-base truncate pr-2">{order.distribuidoraName}</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-muted-foreground text-xs font-medium">
                      {order.items.length} ítems · {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-heading font-bold text-base md:text-lg text-foreground">{formatCurrency(order.total)}</span>
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                </div>
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
