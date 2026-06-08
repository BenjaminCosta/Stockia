'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Check, Clock, Package, X, Search, ChevronLeft, ChevronRight, Truck, CheckCircle2 } from 'lucide-react'
import { PaymentMethodBadge } from '@/components/payment-method-badge'
import { InitialsAvatar } from '@/components/ui/InitialsAvatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { OrderStatus } from '@/lib/types'
import { OrderCardSkeleton } from '@/components/ui/SkeletonCard'
import { StatusBadge } from '@/components/status-badge'
import { updateOrderStatus, type OrderStatus as FSOrderStatus } from '@/lib/data/orders.service'

// ─── Constants ────────────────────────────────────────────────────────────────

const ORDERS_PER_PAGE = 10

const statusFilters: { value: OrderStatus | 'all'; label: string }[] = [
  { value: 'all',           label: 'Todos'          },
  { value: 'pendiente',     label: 'Pendientes'     },
  { value: 'pagado',        label: 'Pagados'        },
  { value: 'en_preparacion',label: 'En preparación' },
  { value: 'entregado',     label: 'Entregados'     },
  { value: 'cancelado',     label: 'Cancelados'     },
  { value: 'no_entregado',  label: 'No entregados'  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PedidosDistribuidoraPage() {
  const { distribuidoraOrders: orders, distribuidoraOrdersLoading: isLoading } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Reset to first page on filter/search change
  useEffect(() => { setPage(1) }, [searchQuery, statusFilter])

  const handleQuickAction = async (orderId: string, action: FSOrderStatus) => {
    setUpdatingId(orderId)
    setErrorMsg(null)
    try {
      await updateOrderStatus(orderId, action)
    } catch {
      setErrorMsg('No se pudo actualizar el pedido. Intentá de nuevo.')
      setTimeout(() => setErrorMsg(null), 4000)
    } finally {
      setUpdatingId(null)
    }
  }

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const { filteredOrders, kpis, actionOrders } = useMemo(() => {
    const q = searchQuery.toLowerCase()

    const filtered = orders.filter(o => {
      const matchesSearch = o.comercioName.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q)
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter
      return matchesSearch && matchesStatus
    })

    const pendingCount = orders.filter(o =>
      o.status === 'pendiente' || o.firestoreStatus === 'pending_confirmation'
    ).length

    const preparingCount = orders.filter(o =>
      o.firestoreStatus === 'preparing' || o.status === 'en_preparacion'
    ).length

    const deliveredThisMonth = orders.filter(o =>
      (o.firestoreStatus === 'delivered' || o.status === 'entregado') &&
      new Date(o.createdAt) >= thisMonthStart
    ).length

    const actions = orders.filter(o => {
      const needsAction =
        o.status === 'pendiente' ||
        o.firestoreStatus === 'pending_confirmation' ||
        o.firestoreStatus === 'confirmed' ||
        o.firestoreStatus === 'preparing' ||
        o.firestoreStatus === 'ready_or_on_the_way'
      const matchesSearch = q === '' || o.comercioName.toLowerCase().includes(q) || o.orderNumber.toLowerCase().includes(q)
      return needsAction && matchesSearch
    })

    return {
      filteredOrders: filtered,
      kpis: { pendingCount, preparingCount, deliveredThisMonth },
      actionOrders: actions,
    }
  }, [orders, searchQuery, statusFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ORDERS_PER_PAGE))
  const paginatedOrders = filteredOrders.slice((page - 1) * ORDERS_PER_PAGE, page * ORDERS_PER_PAGE)

  const showActionSection = statusFilter === 'all' && actionOrders.length > 0

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA] pb-20 overflow-x-hidden md:pb-10">

      {/* ── Error toast ── */}
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold max-w-xs text-center">
          {errorMsg}
        </div>
      )}

      {/* ── Header ── */}
      <header className="border-b border-[#DFE1E8]/80 bg-white px-4 py-5 md:px-8 md:py-6">
        <div className="mx-auto max-w-[1240px]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            {/* Left: titles */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Gestión operativa</p>
              <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#0B1A45] md:text-3xl">Pedidos</h1>
              <p className="mt-0.5 text-sm text-[#7A839C]">Revisá, aceptá y gestioná los pedidos de tus comercios.</p>
            </div>

            {/* Right: 3 KPI mini cards */}
            <div className="grid grid-cols-3 gap-2 md:flex md:gap-2.5 md:shrink-0">
              <div className="flex items-center gap-2 rounded-2xl border border-[#DFE1E8]/80 bg-white px-3 py-2.5 shadow-sm md:gap-3 md:px-4 md:py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 md:h-9 md:w-9">
                  <Clock className="h-3.5 w-3.5 text-amber-500 md:h-4 md:w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-lg font-bold leading-none text-[#0B1A45] md:text-xl">{kpis.pendingCount}</p>
                  <p className="mt-0.5 truncate text-[10px] text-[#7A839C] md:text-[11px]">pendiente{kpis.pendingCount !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[#DFE1E8]/80 bg-white px-3 py-2.5 shadow-sm md:gap-3 md:px-4 md:py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 md:h-9 md:w-9">
                  <Package className="h-3.5 w-3.5 text-sky-500 md:h-4 md:w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-lg font-bold leading-none text-[#0B1A45] md:text-xl">{kpis.preparingCount}</p>
                  <p className="mt-0.5 truncate text-[10px] text-[#7A839C] md:text-[11px]">en prep.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-[#DFE1E8]/80 bg-white px-3 py-2.5 shadow-sm md:gap-3 md:px-4 md:py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F4FBE7] md:h-9 md:w-9">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#4A662E] md:h-4 md:w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-heading text-lg font-bold leading-none text-[#0B1A45] md:text-xl">{kpis.deliveredThisMonth}</p>
                  <p className="mt-0.5 truncate text-[10px] text-[#7A839C] md:text-[11px]">
                    <span className="md:hidden">este mes</span>
                    <span className="hidden md:inline">entregados este mes</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-4 py-5 md:px-8 md:py-6">

        {/* ── Control bar ── */}
        <div className="mb-5 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A839C]" />
            <input
              type="text"
              placeholder="Buscar por comercio o número de pedido..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-10 w-full rounded-xl border border-[#DFE1E8] bg-white pl-9 pr-4 text-sm text-[#0B1A45] placeholder:text-[#9AA3B4] focus:border-[#0B1A45]/30 focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/08 transition"
            />
          </div>

          {/* Status pills */}
          <div className="flex flex-wrap gap-1.5">
            {statusFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`h-8 shrink-0 rounded-lg px-3.5 text-sm font-medium transition-all ${
                  statusFilter === f.value
                    ? 'bg-[#0B1A45] text-white shadow-sm'
                    : 'bg-white border border-[#DFE1E8] text-[#5F6880] hover:border-[#0B1A45]/20 hover:text-[#0B1A45]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <OrderCardSkeleton />
        ) : (
          <>
            {/* ── Requieren acción ── */}
            {showActionSection && (
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="font-heading text-lg font-bold text-[#0B1A45]">Requieren acción</h2>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">
                    {actionOrders.length}
                  </span>
                </div>
                <div className="rounded-3xl border border-[#DFE1E8]/80 bg-white shadow-[0_10px_30px_rgba(11,26,69,0.06)] overflow-hidden">
                  {actionOrders.map((order, i) => (
                    <div
                      key={order.id}
                      className={`px-4 py-4 md:px-6 md:py-5 ${i > 0 ? 'border-t border-[#DFE1E8]/60' : ''}`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                        {/* Avatar + Info */}
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          <InitialsAvatar
                            initials={order.comercioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                            size="md"
                            variant="navy"
                            className="rounded-xl shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="font-semibold text-[#0B1A45] text-sm">{order.comercioName}</h3>
                              <StatusBadge status={order.firestoreStatus ?? order.status} className="text-[10px]" />
                              <PaymentMethodBadge
                                method={order.paymentMethod}
                                labelOverride={order.paymentMethod === 'external' ? 'Pedido externo' : undefined}
                                className="text-[10px] px-2 py-0.5"
                              />
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#7A839C]">
                              <span className="font-mono">{order.orderNumber}</span>
                              <span>·</span>
                              <span>
                                {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {', '}
                                {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount + Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:justify-end sm:shrink-0">
                          <p className="font-heading font-bold text-xl text-[#0B1A45] shrink-0">{formatCurrency(order.total)}</p>
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <Link
                              href={`/distribuidora/pedidos/${order.id}`}
                              className="h-9 px-3.5 rounded-xl border border-[#DFE1E8] bg-white text-xs font-semibold text-[#5F6880] inline-flex items-center hover:bg-[#F7F8FA] transition"
                            >
                              Ver detalle
                            </Link>
                            {(order.status === 'pendiente' || order.firestoreStatus === 'pending_confirmation') && (
                              <>
                                <button
                                  onClick={() => handleQuickAction(order.id, 'cancelled')}
                                  disabled={updatingId === order.id}
                                  className="h-9 px-3.5 rounded-xl border border-red-200 bg-white text-xs font-semibold text-red-500 inline-flex items-center gap-1.5 hover:bg-red-50 transition disabled:opacity-50"
                                >
                                  <X className="h-3.5 w-3.5" /> Rechazar
                                </button>
                                <button
                                  onClick={() => handleQuickAction(order.id, 'confirmed')}
                                  disabled={updatingId === order.id}
                                  className="h-9 px-3.5 rounded-xl bg-[#C8FF00] text-xs font-bold text-[#0B1A45] inline-flex items-center gap-1.5 hover:bg-[#C8FF00]/90 shadow-sm transition disabled:opacity-50"
                                >
                                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                  {updatingId === order.id ? '...' : 'Aceptar'}
                                </button>
                              </>
                            )}
                            {order.firestoreStatus === 'confirmed' && (
                              <button
                                onClick={() => handleQuickAction(order.id, 'preparing')}
                                disabled={updatingId === order.id}
                                className="h-9 px-3.5 rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#14265f] shadow-sm transition disabled:opacity-50"
                              >
                                <Package className="h-3.5 w-3.5" />
                                {updatingId === order.id ? '...' : 'Iniciar prep.'}
                              </button>
                            )}
                            {order.firestoreStatus === 'preparing' && (
                              <button
                                onClick={() => handleQuickAction(order.id, 'ready_or_on_the_way')}
                                disabled={updatingId === order.id}
                                className="h-9 px-3.5 rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#14265f] shadow-sm transition disabled:opacity-50"
                              >
                                <Truck className="h-3.5 w-3.5" />
                                {updatingId === order.id ? '...' : 'En camino'}
                              </button>
                            )}
                            {order.firestoreStatus === 'ready_or_on_the_way' && (
                              <button
                                onClick={() => handleQuickAction(order.id, 'delivered')}
                                disabled={updatingId === order.id}
                                className="h-9 px-3.5 rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#14265f] shadow-sm transition disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                {updatingId === order.id ? '...' : 'Marcar entregado'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Todos los pedidos ── */}
            {filteredOrders.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No hay pedidos"
                description={searchQuery || statusFilter !== 'all'
                  ? 'No se encontraron pedidos con esos filtros'
                  : 'Los pedidos de los comercios aparecerán acá'}
              />
            ) : (
              <div>
                <h2 className="mb-3 font-heading text-lg font-bold text-[#0B1A45]">Todos los pedidos</h2>
                <div className="rounded-3xl border border-[#DFE1E8]/80 bg-white shadow-[0_10px_30px_rgba(11,26,69,0.06)] overflow-hidden">
                  {/* Table header — desktop only */}
                  <div className="hidden border-b border-[#DFE1E8]/60 md:grid md:grid-cols-[1fr_180px_140px_minmax(180px,auto)] px-6 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Comercio</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Estado</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C] text-right">Monto</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C] text-right">Acciones</span>
                  </div>

                  {/* Rows */}
                  {paginatedOrders.map((order, i) => (
                    <div
                      key={order.id}
                      className={`px-4 py-3.5 transition-colors hover:bg-[#FAFBFC] md:px-6 md:py-4 ${i > 0 ? 'border-t border-[#DFE1E8]/50' : ''}`}
                    >
                      {/* Desktop layout */}
                      <div className="hidden md:grid md:grid-cols-[1fr_180px_140px_minmax(180px,auto)] md:items-center md:gap-4">
                        {/* Comercio */}
                        <div className="flex items-center gap-3 min-w-0">
                          <InitialsAvatar
                            initials={order.comercioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                            size="sm"
                            variant="navy"
                            className="rounded-lg shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[#0B1A45] truncate">{order.comercioName}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-[#7A839C]">
                              <span className="font-mono">{order.orderNumber}</span>
                              <span>·</span>
                              <span>
                                {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {', '}
                                {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Package className="h-2.5 w-2.5" />
                                {order.items.length} producto{order.items.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Estado */}
                        <div className="flex flex-col gap-1.5">
                          <StatusBadge status={order.firestoreStatus ?? order.status} className="text-[10px] self-start" />
                          <PaymentMethodBadge
                            method={order.paymentMethod}
                            labelOverride={order.paymentMethod === 'external' ? 'Pedido externo' : undefined}
                            className="text-[10px] px-2 py-0.5 self-start"
                          />
                        </div>

                        {/* Monto */}
                        <div className="text-right">
                          <p className="font-heading font-bold text-lg text-[#0B1A45]">{formatCurrency(order.total)}</p>
                        </div>

                        {/* Acciones */}
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/distribuidora/pedidos/${order.id}`}
                            className="h-8 px-3 rounded-xl border border-[#DFE1E8] bg-[#F7F8FA] text-xs font-semibold text-[#5F6880] inline-flex items-center hover:bg-[#EEEEF2] transition"
                          >
                            Ver detalle
                          </Link>
                          {order.firestoreStatus === 'confirmed' && (
                            <button
                              onClick={() => handleQuickAction(order.id, 'preparing')}
                              disabled={updatingId === order.id}
                              className="h-8 px-3 rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold inline-flex items-center hover:bg-[#14265f] transition disabled:opacity-50 whitespace-nowrap"
                            >
                              {updatingId === order.id ? '...' : 'Iniciar prep.'}
                            </button>
                          )}
                          {order.firestoreStatus === 'preparing' && (
                            <button
                              onClick={() => handleQuickAction(order.id, 'ready_or_on_the_way')}
                              disabled={updatingId === order.id}
                              className="h-8 px-3 rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold inline-flex items-center gap-1 hover:bg-[#14265f] transition disabled:opacity-50 whitespace-nowrap"
                            >
                              <Truck className="h-3 w-3" />
                              {updatingId === order.id ? '...' : 'En camino'}
                            </button>
                          )}
                          {order.firestoreStatus === 'ready_or_on_the_way' && (
                            <button
                              onClick={() => handleQuickAction(order.id, 'delivered')}
                              disabled={updatingId === order.id}
                              className="h-8 px-3 rounded-xl bg-[#0B1A45] text-[#C8FF00] text-xs font-bold inline-flex items-center gap-1 hover:bg-[#14265f] transition disabled:opacity-50 whitespace-nowrap"
                            >
                              <Check className="h-3 w-3" strokeWidth={3} />
                              {updatingId === order.id ? '...' : 'Entregado'}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Mobile layout */}
                      <div className="flex items-start gap-3 md:hidden">
                        <InitialsAvatar
                          initials={order.comercioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
                          size="sm"
                          variant="navy"
                          className="rounded-lg shrink-0 mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-[#0B1A45] truncate">{order.comercioName}</p>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <StatusBadge status={order.firestoreStatus ?? order.status} className="text-[10px]" />
                                <PaymentMethodBadge
                                  method={order.paymentMethod}
                                  labelOverride={order.paymentMethod === 'external' ? 'Pedido externo' : undefined}
                                  className="text-[10px] px-2 py-0.5"
                                />
                              </div>
                              <p className="mt-1 text-[11px] text-[#7A839C]">
                                {order.orderNumber} · {new Date(order.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-heading font-bold text-base text-[#0B1A45]">{formatCurrency(order.total)}</p>
                              <Link
                                href={`/distribuidora/pedidos/${order.id}`}
                                className="mt-1.5 inline-flex h-7 items-center px-2.5 rounded-lg border border-[#DFE1E8] bg-[#F7F8FA] text-[11px] font-semibold text-[#5F6880]"
                              >
                                Ver detalle
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pagination footer */}
                  <div className="flex items-center justify-between border-t border-[#DFE1E8]/60 px-4 py-3.5 md:px-6">
                    <p className="text-[12px] text-[#7A839C] md:text-[13px]">
                      <span className="md:hidden">{(page - 1) * ORDERS_PER_PAGE + 1}–{Math.min(page * ORDERS_PER_PAGE, filteredOrders.length)} de {filteredOrders.length}</span>
                      <span className="hidden md:inline">Mostrando {(page - 1) * ORDERS_PER_PAGE + 1}–{Math.min(page * ORDERS_PER_PAGE, filteredOrders.length)} de {filteredOrders.length} pedidos</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DFE1E8] bg-white text-[#5F6880] transition hover:bg-[#F7F8FA] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {/* Desktop: all page numbers */}
                      <div className="hidden md:flex md:items-center md:gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                          <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold transition ${
                              p === page
                                ? 'bg-[#0B1A45] text-white shadow-sm'
                                : 'border border-[#DFE1E8] bg-white text-[#5F6880] hover:bg-[#F7F8FA]'
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                      {/* Mobile: current/total */}
                      <span className="flex h-8 min-w-[56px] items-center justify-center rounded-lg bg-[#0B1A45] px-3 text-sm font-semibold text-white md:hidden">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#DFE1E8] bg-white text-[#5F6880] transition hover:bg-[#F7F8FA] disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
