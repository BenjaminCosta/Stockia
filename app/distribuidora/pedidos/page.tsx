'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Check, Clock, MapPin, Package, X } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { PillFilter } from '@/components/ui/PillFilter'
import { EmptyState } from '@/components/ui/EmptyState'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { PaymentMethodBadge } from '@/components/payment-method-badge'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { OrderStatus } from '@/lib/types'
import { OrderCardSkeleton } from '@/components/ui/SkeletonCard'
import { StatusBadge } from '@/components/status-badge'
import { updateOrderStatus, type OrderStatus as FSOrderStatus } from '@/lib/data/orders.service'

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'pagado', label: 'Pagados' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'entregado', label: 'Entregados' },
]

export default function PedidosDistribuidoraPage() {
  const { distribuidoraOrders: orders, distribuidoraOrdersLoading: isLoading } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const handleQuickAction = async (orderId: string, action: FSOrderStatus) => {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, action)
    } catch (err) {
      console.error('[pedidos-list] updateOrderStatus failed', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const { filteredOrders, pendingCount } = useMemo(() => {
    const q = searchQuery.toLowerCase()
    const filtered = orders.filter(o => {
      const matchesSearch = o.comercioName.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      return matchesSearch && matchesStatus
    })
    const pending = orders.filter(o =>
      o.status === 'pendiente' || o.firestoreStatus === 'pending_confirmation'
    ).length
    return { filteredOrders: filtered, pendingCount: pending }
  }, [orders, searchQuery, statusFilter])

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-8">
      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#DFE1E8]/80 px-4 md:px-8 pt-4 md:pt-6 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-start justify-between mb-3 md:mb-4 gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-0.5">Gestión operativa</p>
              <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-[#0B1A45]">Pedidos</h1>
              <p className="text-sm text-muted-foreground mt-0.5 hidden md:block">Revisá, aceptá y gestioná los pedidos de tus comercios.</p>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/80 rounded-2xl px-3 py-1.5 shrink-0 mt-1">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-amber-700 text-xs font-bold">{pendingCount} pendientes</span>
              </div>
            )}
          </div>
          <div className="pb-3 md:pb-4 space-y-2 md:space-y-2.5">
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
            {filteredOrders.map((order, i) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl md:rounded-3xl border border-[#DFE1E8]/80 p-3.5 md:p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#0B1A45]/15 hover:shadow-[0_8px_20px_rgba(11,26,69,0.08)] animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
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
                      <StatusBadge status={order.firestoreStatus ?? order.status} />
                      <PaymentMethodBadge
                        method={order.paymentMethod}
                        labelOverride={order.paymentMethod === 'external' ? 'Pedido externo' : undefined}
                        className="text-[10px] px-2 py-0.5"
                      />
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="font-mono">{order.orderNumber}</span>
                      <span className="flex items-center gap-1">
                        <Package className="h-2.5 w-2.5" /> {order.items.length} productos
                      </span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="shrink-0 text-right">
                    <p className="font-heading font-bold text-lg md:text-xl text-[#0B1A45]">{formatCurrency(order.total)}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex flex-wrap gap-1.5 md:gap-2 justify-end">
                  <Link
                    href={`/distribuidora/pedidos/${order.id}`}
                    className="h-8 md:h-9 px-3 rounded-xl bg-[#F7F8FA] border border-[#DFE1E8]/80 text-[#5F6880] text-xs font-semibold inline-flex items-center gap-1 hover:bg-[#EFF0F3] transition-colors"
                  >
                    Ver detalle
                  </Link>
                  {order.status === 'pendiente' && (
                    <>
                      <button
                        onClick={() => handleQuickAction(order.id, 'cancelled')}
                        disabled={updatingId === order.id}
                        className="h-8 md:h-9 px-3 rounded-xl bg-white border border-[#DFE1E8]/80 text-red-500 text-xs font-semibold inline-flex items-center gap-1 hover:bg-red-50 hover:border-red-200/80 transition-colors disabled:opacity-50"
                      >
                        <X className="h-3 w-3" /> Rechazar
                      </button>
                      <button
                        onClick={() => handleQuickAction(order.id, 'confirmed')}
                        disabled={updatingId === order.id}
                        className="h-8 md:h-9 px-3 rounded-xl bg-[#C8FF00] text-[#0B1A45] text-xs font-bold inline-flex items-center gap-1 hover:bg-[#C8FF00]/90 shadow-sm transition-colors disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" strokeWidth={3} /> {updatingId === order.id ? '...' : 'Aceptar'}
                      </button>
                    </>
                  )}
                  {order.firestoreStatus === 'confirmed' && (
                    <button
                      onClick={() => handleQuickAction(order.id, 'preparing')}
                      disabled={updatingId === order.id}
                      className="h-8 md:h-9 px-3 rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold hover:bg-[#14265f] shadow-sm transition-colors disabled:opacity-50"
                    >
                      {updatingId === order.id ? '...' : 'Iniciar prep.'}
                    </button>
                  )}
                  {order.firestoreStatus === 'preparing' && (
                    <button
                      onClick={() => handleQuickAction(order.id, 'ready_or_on_the_way')}
                      disabled={updatingId === order.id}
                      className="h-8 md:h-9 px-3 rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold hover:bg-[#14265f] shadow-sm transition-colors disabled:opacity-50"
                    >
                      {updatingId === order.id ? '...' : 'Marcar en camino'}
                    </button>
                  )}
                  {order.firestoreStatus === 'ready_or_on_the_way' && (
                    <button
                      onClick={() => handleQuickAction(order.id, 'delivered')}
                      disabled={updatingId === order.id}
                      className="h-8 md:h-9 px-3 rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold hover:bg-[#14265f] shadow-sm transition-colors disabled:opacity-50"
                    >
                      {updatingId === order.id ? '...' : 'Marcar entregado'}
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
