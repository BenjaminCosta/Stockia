'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, ChevronRight, Package } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { useApp } from '@/lib/app-context'
import { getOrdersByDistribuidora, formatCurrency } from '@/lib/mock-data'
import { Distribuidora, OrderStatus } from '@/lib/types'
import { OrderCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'pagado', label: 'Pagados' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'entregado', label: 'Entregados' },
]

const getStatusClass = (status: OrderStatus) => {
  if (status === 'pendiente') return 'bg-amber-100 text-amber-700'
  if (status === 'pagado') return 'bg-blue-100 text-blue-700'
  if (status === 'en_preparacion') return 'bg-purple-100 text-purple-700'
  if (status === 'entregado') return 'bg-green-100 text-green-700'
  return 'bg-gray-100 text-gray-700'
}

export default function PedidosDistribuidoraPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser as Distribuidora | null
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const isLoading = useMockLoading()

  const orders = getOrdersByDistribuidora(distribuidora?.id || 'dist-1')

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.comercioName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <header className="sticky top-0 md:top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-5 md:pt-6 pb-0">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-4 md:mb-6">Pedidos Recibidos</h1>

          <div className="flex gap-2 pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por comercio o número..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 md:pl-12 pr-4 py-3 md:py-3.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
            <button className="bg-white border border-gray-200 w-12 md:w-14 rounded-xl text-gray-600 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <OrderCardSkeleton />
        ) : (
          <>
            {filteredOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="font-heading font-semibold text-xl text-foreground">No hay pedidos</h2>
                <p className="text-muted-foreground mt-2 text-center">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No se encontraron pedidos con esos filtros'
                    : 'Los pedidos de los comercios aparecerán acá'}
                </p>
              </div>
            ) : (
              <div className="bg-white md:rounded-2xl md:shadow-sm border border-transparent md:border-gray-200 overflow-hidden">
                {/* Desktop header row */}
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <div className="col-span-1">ID</div>
                  <div className="col-span-3">Comercio</div>
                  <div className="col-span-2">Zona</div>
                  <div className="col-span-2">Monto</div>
                  <div className="col-span-2">Estado</div>
                  <div className="col-span-2 text-right">Acción</div>
                </div>

                <div className="grid grid-cols-1 gap-4 p-4 md:p-0 md:gap-0">
                  {filteredOrders.map((order, i) => (
                    <Link key={order.id} href={`/distribuidora/pedidos/${order.id}`}>
                      <div className={`bg-white rounded-2xl md:rounded-none p-5 md:p-4 border border-gray-100 md:border-x-0 md:border-t-0 md:grid md:grid-cols-12 md:gap-4 md:items-center cursor-pointer hover:bg-gray-50 transition-colors shadow-sm md:shadow-none ${i !== 0 ? 'md:border-t md:border-gray-100' : ''}`}>
                        {/* Mobile header */}
                        <div className="md:hidden flex justify-between items-start mb-3">
                          <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{order.orderNumber}</span>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${getStatusClass(order.status)}`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Desktop ID */}
                        <div className="hidden md:block col-span-1 text-sm font-medium text-gray-500">{order.orderNumber}</div>

                        {/* Store Info */}
                        <div className="col-span-3 mb-4 md:mb-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                              <span className="font-heading font-bold text-xs text-gray-500">
                                {order.comercioName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <div className="font-bold text-foreground text-base md:text-sm leading-tight">{order.comercioName}</div>
                              <div className="text-xs text-gray-500 mt-0.5 md:hidden">{order.items.length} productos · {order.zone}</div>
                            </div>
                          </div>
                        </div>

                        {/* Desktop Zone */}
                        <div className="col-span-2 hidden md:block text-sm text-gray-600">{order.zone}</div>

                        {/* Total */}
                        <div className="col-span-2 mb-4 md:mb-0 flex md:block justify-between items-center bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
                          <span className="md:hidden text-xs font-bold text-gray-500 uppercase tracking-wider">Total</span>
                          <div className="font-heading font-bold text-xl md:text-base text-foreground">{formatCurrency(order.total)}</div>
                        </div>

                        {/* Desktop Status */}
                        <div className="col-span-2 hidden md:block">
                          <StatusBadge status={order.status} />
                        </div>

                        {/* Action */}
                        <div className="col-span-2 flex justify-between md:justify-end items-center gap-2 pt-3 md:pt-0 border-t border-gray-50 md:border-none">
                          <span className="md:hidden text-primary text-sm font-bold">Ver detalle</span>
                          <ChevronRight className="h-5 w-5 md:h-4 md:w-4 text-gray-300 shrink-0" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
