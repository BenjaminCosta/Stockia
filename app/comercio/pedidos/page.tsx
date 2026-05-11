'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { Package, Clock, CheckCircle2, ChevronRight, CheckCircle, ShoppingCart } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { mockOrders, formatCurrency } from '@/lib/mock-data'
import { useApp } from '@/lib/app-context'
import { Comercio, OrderStatus } from '@/lib/types'
import { OrderCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'
import { Button } from '@/components/ui/button'

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pendiente': return 'bg-amber-100 text-amber-700'
    case 'pagado': return 'bg-blue-100 text-blue-700'
    case 'en_preparacion': return 'bg-purple-100 text-purple-700'
    case 'entregado': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

const getStatusIcon = (status: OrderStatus) => {
  switch (status) {
    case 'entregado': return <CheckCircle2 className="h-3 w-3 mr-1" />
    case 'en_preparacion': return <Package className="h-3 w-3 mr-1" />
    default: return <Clock className="h-3 w-3 mr-1" />
  }
}

function PedidosContent() {
  const searchParams = useSearchParams()
  const showSuccess = searchParams.get('success') === 'true'
  const { currentUser, getCartItemCount } = useApp()
  const isLoading = useMockLoading()
  const [activeTab, setActiveTab] = useState<'Activos' | 'Historial'>('Activos')

  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const orders = mockOrders.filter(o => o.comercioId === (comercio?.id || 'com-1'))
  const cartItemCount = getCartItemCount()

  const filtered = orders.filter(o =>
    activeTab === 'Activos' ? o.status !== 'entregado' : o.status === 'entregado'
  )

  const activeCount = orders.filter(o => o.status !== 'entregado').length

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with tabs */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 md:px-8 pt-6 pb-0 max-w-5xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-4 md:mb-6">Mis pedidos</h1>
            <Link
              href="/comercio/carrito"
              className="hidden md:flex h-10 w-10 bg-gray-50 rounded-full items-center justify-center relative hover:bg-gray-100 transition-colors mb-4"
            >
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
          <div className="flex space-x-6 border-b border-gray-200">
            <button
              className={`pb-3 text-sm md:text-base font-bold transition-colors relative ${activeTab === 'Activos' ? 'text-primary' : 'text-gray-500 hover:text-foreground'}`}
              onClick={() => setActiveTab('Activos')}
            >
              Activos ({activeCount})
              {activeTab === 'Activos' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
            </button>
            <button
              className={`pb-3 text-sm md:text-base font-bold transition-colors relative ${activeTab === 'Historial' ? 'text-primary' : 'text-gray-500 hover:text-foreground'}`}
              onClick={() => setActiveTab('Historial')}
            >
              Historial
              {activeTab === 'Historial' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        {/* Success banner */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-800">Pedido confirmado</p>
              <p className="text-sm text-emerald-700">Tu pedido fue enviado a la distribuidora</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <OrderCardSkeleton />
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-heading font-bold text-foreground text-lg">No hay pedidos</h3>
            <p className="text-muted-foreground mt-1">No tenés pedidos en esta sección.</p>
            {activeTab === 'Activos' && (
              <Link href="/comercio" className="mt-6 inline-block">
                <Button>Explorar distribuidoras</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {filtered.map(order => (
              <Link key={order.id} href={`/comercio/pedidos/${order.id}`}>
                <div className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all cursor-pointer h-full flex flex-col group">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] md:text-xs px-2.5 py-1.5 rounded-lg font-bold flex items-center uppercase tracking-wide ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs md:text-sm text-muted-foreground font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                      {order.orderNumber}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-500 text-sm md:text-base group-hover:bg-red-50 group-hover:text-primary transition-colors">
                      {order.distribuidoraName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <h3 className="font-bold text-foreground text-base md:text-lg group-hover:text-primary transition-colors leading-tight">
                      {order.distribuidoraName}
                    </h3>
                  </div>

                  <div className="flex justify-between items-end mt-auto pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      <span className="block font-medium">{order.items.length} ítems</span>
                      <span className="block text-xs mt-1 text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="font-heading font-bold text-xl md:text-2xl text-foreground">{formatCurrency(order.total)}</span>
                      <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary transition-colors" />
                    </div>
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
