'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, CreditCard, Handshake, AlertTriangle, FlaskConical } from 'lucide-react'
import { getAdminOrders, type AdminOrder } from '@/lib/data/admin.service'
import { formatCurrency } from '@/lib/utils'
import { AdminListSkeleton } from '@/components/ui/SkeletonCard'

type StatusFilter = AdminOrder['orderStatus'] | 'all'
type PaymentFilter = 'all' | 'mercado_pago' | 'external'
type ViewMode = 'real' | 'test' | 'all'

const statusConfig: Record<AdminOrder['orderStatus'], { label: string; className: string }> = {
  pending_confirmation:       { label: 'Pend. confirmación', className: 'bg-amber-50 text-amber-700' },
  confirmed:                  { label: 'Confirmado',         className: 'bg-blue-50 text-blue-700' },
  preparing:                  { label: 'En preparación',     className: 'bg-purple-50 text-purple-700' },
  ready_or_on_the_way:        { label: 'En camino',          className: 'bg-sky-50 text-sky-700' },
  delivered:                  { label: 'Entregado',           className: 'bg-green-50 text-green-700' },
  delivered_with_adjustments: { label: 'Entregado c/ajustes', className: 'bg-teal-50 text-teal-700' },
  cancelled:                  { label: 'Cancelado',           className: 'bg-red-50 text-red-700' },
  not_delivered:              { label: 'No entregado',        className: 'bg-orange-50 text-orange-700' },
}

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all',                        label: 'Todos' },
  { value: 'pending_confirmation',       label: 'Pendientes' },
  { value: 'confirmed',                  label: 'Confirmados' },
  { value: 'preparing',                  label: 'En preparación' },
  { value: 'ready_or_on_the_way',        label: 'En camino' },
  { value: 'delivered',                  label: 'Entregados' },
  { value: 'delivered_with_adjustments', label: 'Entregado c/ajustes' },
  { value: 'cancelled',                  label: 'Cancelados' },
  { value: 'not_delivered',              label: 'No entregados' },
]

const VALID_STATUS_PARAMS: StatusFilter[] = [
  'pending_confirmation', 'confirmed', 'preparing', 'ready_or_on_the_way',
  'delivered', 'delivered_with_adjustments', 'cancelled', 'not_delivered',
]

export default function AdminPedidosPage() {
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('real')

  const paramStatus = searchParams.get('status') as StatusFilter | null
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    paramStatus && VALID_STATUS_PARAMS.includes(paramStatus) ? paramStatus : 'all'
  )

  useEffect(() => { getAdminOrders().then(data => { setOrders(data); setLoading(false) }) }, [])

  const viewOrders = orders.filter(o =>
    viewMode === 'real' ? !o.isInternalTest :
    viewMode === 'test' ? !!o.isInternalTest :
    true
  )

  const filtered = viewOrders.filter(o => {
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.commerceName.toLowerCase().includes(search.toLowerCase()) ||
      o.distributorName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.orderStatus === statusFilter
    const matchPayment = paymentFilter === 'all' || o.paymentMethod === paymentFilter
    return matchSearch && matchStatus && matchPayment
  })

  const pendingExternal = viewOrders.filter(o => o.orderStatus === 'pending_confirmation' && o.paymentMethod === 'external').length
  const cancelledCount = viewOrders.filter(o => o.orderStatus === 'cancelled' || o.orderStatus === 'not_delivered').length
  const testCount = orders.filter(o => o.isInternalTest).length

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <div className="h-7 w-24 bg-[#EEF1F5] rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-20 bg-[#EEF1F5] rounded animate-pulse" />
        </div>
        <AdminListSkeleton rows={6} label="Cargando pedidos" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">Pedidos</h1>
          <p className="text-gray-500 text-sm mt-1">{viewOrders.length} {viewMode === 'real' ? 'reales' : viewMode === 'test' ? 'de prueba' : 'en total'}</p>
        </div>
        {/* Real / Test toggle */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { value: 'real', label: 'Reales' },
            { value: 'test', label: 'Prueba', icon: FlaskConical },
            { value: 'all',  label: 'Todos' },
          ] as const).map(m => (
            <button
              key={m.value}
              onClick={() => setViewMode(m.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === m.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {'icon' in m && <m.icon className="h-3 w-3" />}
              {m.label}
              {m.value === 'test' && testCount > 0 && (
                <span className="ml-0.5 bg-gray-200 text-gray-500 rounded-full px-1.5 text-[10px] font-bold">{testCount}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alert chips */}
      {(pendingExternal > 0 || cancelledCount > 0) && (
        <div className="flex flex-wrap gap-3 mb-5">
          {pendingExternal > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm">
              <Handshake className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-amber-700">{pendingExternal} pedidos externos pendientes</span>
            </div>
          )}
          {cancelledCount > 0 && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="font-semibold text-red-700">{cancelledCount} cancelados / no entregados</span>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar pedido, comercio o distribuidora..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Payment filter */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
            {([
              { value: 'all', label: 'Todos los pagos' },
              { value: 'mercado_pago', label: 'Mercado Pago', icon: CreditCard },
              { value: 'external', label: 'Coordinar', icon: Handshake },
            ] as const).map(f => (
              <button
                key={f.value}
                onClick={() => setPaymentFilter(f.value)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${paymentFilter === f.value ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {'icon' in f && <f.icon className="h-3.5 w-3.5" />}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status pills */}
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${statusFilter === f.value ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Sin pedidos</div>
        )}
        {filtered.map(o => (
          <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-gray-400">{o.orderNumber}</span>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'}
                  </span>
                </div>
                <p className="font-semibold text-gray-900 truncate">{o.commerceName}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{o.distributorName}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${statusConfig[o.orderStatus].className}`}>
                {statusConfig[o.orderStatus].label}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <div>
                <p className="text-base font-bold text-gray-900">{formatCurrency(o.deliveredTotal ?? o.total)}</p>
                {o.hasItemAdjustments && o.originalTotal && o.originalTotal !== (o.deliveredTotal ?? o.total) && (
                  <p className="text-xs text-gray-400 line-through">{formatCurrency(o.originalTotal)}</p>
                )}
              </div>
              {o.paymentMethod === 'mercado_pago' ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1 rounded-full">
                  <CreditCard className="h-3.5 w-3.5" /> Mercado Pago
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-full">
                  <Handshake className="h-3.5 w-3.5" /> Coordinar
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">N° Pedido</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Comercio</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Distribuidora</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Pago</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Total</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden xl:table-cell">Motivo</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(o => (
                <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-mono font-semibold text-gray-700 text-xs">{o.orderNumber}</span>
                  </td>
                  <td className="px-4 py-4 font-medium text-gray-900">{o.commerceName}</td>
                  <td className="px-4 py-4 text-gray-600">{o.distributorName}</td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    {o.paymentMethod === 'mercado_pago' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
                        <CreditCard className="h-3.5 w-3.5" /> Mercado Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                        <Handshake className="h-3.5 w-3.5" /> Coordinar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-semibold text-gray-900">{formatCurrency(o.deliveredTotal ?? o.total)}</span>
                    {o.hasItemAdjustments && o.originalTotal && o.originalTotal !== (o.deliveredTotal ?? o.total) && (
                      <span className="block text-xs text-gray-400 line-through">{formatCurrency(o.originalTotal)}</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[o.orderStatus].className}`}>
                      {statusConfig[o.orderStatus].label}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden xl:table-cell">
                    {(o.orderStatus === 'cancelled' || o.orderStatus === 'not_delivered') && (o as any).cancellationReason && (
                      <span className="text-xs text-gray-500 italic">{(o as any).cancellationReason}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-gray-400 text-xs hidden lg:table-cell">
                    {o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Sin pedidos</div>
          )}
        </div>
      </div>
    </div>
  )
}
