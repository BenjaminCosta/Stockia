'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, CheckCircle, Package } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { mockOrders, formatCurrency } from '@/lib/mock-data'
import { useApp } from '@/lib/app-context'
import { Comercio, OrderStatus } from '@/lib/types'
import { OrderCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'
import { StatusBadge } from '@/components/status-badge'

function PedidosContent() {
  const searchParams = useSearchParams()
  const showSuccess = searchParams.get('success') === 'true'
  const { currentUser } = useApp()
  const isLoading = useMockLoading()
  const [activeTab, setActiveTab] = useState<'Activos' | 'Historial'>('Activos')

  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const orders = mockOrders.filter(o => o.comercioId === (comercio?.id || 'com-1'))

  const activeOrders = orders.filter(o => o.status !== 'entregado' && o.status !== 'cancelado')
  const historialOrders = orders.filter(o => o.status === 'entregado' || o.status === 'cancelado')
  const filtered = activeTab === 'Activos' ? activeOrders : historialOrders

  // The most recent active order gets featured treatment
  const featuredOrder = activeTab === 'Activos' && filtered.length > 0 ? filtered[0] : null
  const restOrders = featuredOrder ? filtered.slice(1) : filtered

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-8">
      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-5 md:pt-6 pb-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-foreground">Mis pedidos</h1>
          <p className="text-sm text-muted-foreground mt-1">{activeOrders.length} pedido{activeOrders.length !== 1 ? 's' : ''} activo{activeOrders.length !== 1 ? 's' : ''}</p>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 pt-4 max-w-5xl mx-auto w-full">
        {/* Success banner */}
        {showSuccess && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800 text-sm">Pedido confirmado</p>
              <p className="text-xs text-emerald-700">Tu pedido fue enviado a la distribuidora</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-border p-1.5 flex gap-1 mb-6">
          {(['Activos', 'Historial'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-[#0B1A45] text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
          <div className="space-y-4">
            {/* Featured most-recent active order */}
            {featuredOrder && (
              <Link href={`/comercio/pedidos/${featuredOrder.id}`}>
                <div className="bg-[#0B1A45] rounded-3xl p-6 relative overflow-hidden cursor-pointer group">
                  <svg className="absolute right-0 top-0 h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100%" cy="0" r="50%" fill="none" stroke="white" strokeWidth="30" />
                  </svg>
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <StatusBadge status={featuredOrder.status} />
                      <span className="text-white/40 text-xs font-mono font-medium">{featuredOrder.orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-5">
                      <div className="h-12 w-12 bg-[#C8FF00]/15 rounded-2xl flex items-center justify-center font-bold text-[#C8FF00] text-sm shrink-0">
                        {featuredOrder.distribuidoraName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-white/50 text-xs font-medium mb-0.5">Distribuidor</p>
                        <h3 className="font-bold text-white text-lg leading-tight">{featuredOrder.distribuidoraName}</h3>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-white/10">
                      <div>
                        <p className="text-white/50 text-xs font-medium">{featuredOrder.items.length} productos · {new Date(featuredOrder.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-2xl text-white">{formatCurrency(featuredOrder.total)}</span>
                        <div className="h-8 w-8 bg-[#C8FF00] rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                          <ChevronRight className="h-4 w-4 text-[#0B1A45]" />
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
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-border hover:shadow-md hover:border-primary/15 transition-all cursor-pointer flex items-center gap-4 group">
                  <InitialsAvatar
                    initials={order.distribuidoraName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                    size="lg"
                    variant="gray"
                    className="rounded-2xl group-hover:bg-[#F1FFD1] group-hover:text-[#4A662E] transition-colors"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-foreground text-base truncate pr-2">{order.distribuidoraName}</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="text-muted-foreground text-xs font-medium">
                      {order.items.length} ítems · {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-heading font-bold text-lg text-foreground">{formatCurrency(order.total)}</span>
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
