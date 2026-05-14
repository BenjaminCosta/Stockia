'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Clock, MapPin, Package, X } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { PillFilter } from '@/components/ui/PillFilter'
import { EmptyState } from '@/components/ui/EmptyState'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { useApp } from '@/lib/app-context'
import { getOrdersByDistribuidora, formatCurrency } from '@/lib/mock-data'
import { Distribuidora, OrderStatus } from '@/lib/types'
import { OrderCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'
import { StatusBadge } from '@/components/status-badge'

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'pagado', label: 'Pagados' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'entregado', label: 'Entregados' },
]

export default function PedidosDistribuidoraPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
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

  const pendingCount = orders.filter(o => o.status === 'pendiente').length

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-8">
      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-3 md:pt-6 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground">Pedidos recibidos</h1>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl md:rounded-2xl px-2.5 py-1 md:px-3 md:py-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-700 text-xs md:text-sm font-bold">{pendingCount} pendientes</span>
              </div>
            )}
          </div>
          <div className="pb-3 md:pb-4 space-y-2 md:space-y-3">
            <SearchInput
              placeholder="Buscar por comercio o número de pedido..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
            <PillFilter
              items={statusFilters}
              selected={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 md:px-8 py-3 md:py-4 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <OrderCardSkeleton />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay pedidos"
            description={searchQuery || statusFilter !== 'all'
              ? 'No se encontraron pedidos con esos filtros'
              : 'Los pedidos de los comercios aparecerán acá'}
          />
        ) : (
          <div className="space-y-2.5 md:space-y-3">
            {filteredOrders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl md:rounded-3xl border border-border p-3.5 md:p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <InitialsAvatar
                    initials={order.comercioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                    size="md"
                    variant="navy"
                    className="rounded-xl shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">{order.comercioName}</h3>
                      <StatusBadge status={order.status} />
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="font-mono">{order.orderNumber}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-[10px] w-[10px] text-[#89B317]" /> {order.zone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-[10px] w-[10px]" /> {order.items.length} productos
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="shrink-0 text-right">
                    <p className="font-heading font-bold text-base md:text-xl text-foreground">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap gap-1.5 md:gap-2 justify-end">
                  <Link
                    href={`/distribuidora/pedidos/${order.id}`}
                    className="h-8 md:h-9 px-3 rounded-lg md:rounded-xl bg-gray-100 text-foreground text-xs font-bold inline-flex items-center gap-1 hover:bg-gray-200 transition-colors"
                  >
                    Ver detalle
                  </Link>
                  {order.status === 'pendiente' && (
                    <>
                      <button className="h-8 md:h-9 px-3 rounded-lg md:rounded-xl bg-white border border-border text-red-500 text-xs font-bold inline-flex items-center gap-1 hover:bg-red-50 transition-colors">
                        <X className="h-3 w-3" /> Rechazar
                      </button>
                      <button className="h-8 md:h-9 px-3 rounded-lg md:rounded-xl bg-[#C8FF00] text-[#0B1A45] text-xs font-bold inline-flex items-center gap-1 hover:bg-[#C8FF00]/90 transition-colors">
                        <Check className="h-3 w-3" strokeWidth={3} /> Aceptar
                      </button>
                    </>
                  )}
                  {order.status === 'en_preparacion' && (
                    <button className="h-8 md:h-9 px-3 rounded-lg md:rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold hover:bg-[#0B1A45]/90 transition-colors">
                      Marcar como listo
                    </button>
                  )}
                  {order.status === 'pagado' && (
                    <button className="h-8 md:h-9 px-3 rounded-lg md:rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold hover:bg-[#0B1A45]/90 transition-colors">
                      Marcar entregado
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
