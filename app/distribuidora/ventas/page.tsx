'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  TrendingUp, ShoppingBag, Receipt, Package,
  AlertTriangle, Clock, CheckCircle2, XCircle,
  Percent, Info, ArrowRight, ChevronRight, ChevronUp,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { formatCurrency } from '@/lib/mock-data'
import { StatusBadge } from '@/components/status-badge'
import { SalesDashboardSkeleton } from '@/components/ui/SkeletonCard'
import { useApp } from '@/lib/app-context'
import { Distribuidora, type Order } from '@/lib/types'
import { getCommissionsByDistributor, type FirestoreCommission } from '@/lib/data/commissions.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Period = 'month' | 'all'

function filterOrdersByPeriod(orders: Order[], period: Period): Order[] {
  if (period === 'all') return orders
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return orders.filter(o => new Date(o.createdAt) >= start)
}

function computeKPIs(orders: Order[]) {
  const total = orders.reduce((s, o) => s + o.total, 0)
  const completed = orders.filter(o => o.status === 'entregado').length
  const avg = orders.length > 0 ? Math.round(total / orders.length) : 0
  const units = orders.flatMap(o => o.items).reduce((s, i) => s + i.quantity, 0)
  return { total, completed, avg, units, count: orders.length }
}

function computeTopProducts(orders: Order[]) {
  const map: Record<string, { name: string; units: number; revenue: number }> = {}
  orders.forEach(o => o.items.forEach(i => {
    if (!map[i.productId]) map[i.productId] = { name: i.productName, units: 0, revenue: 0 }
    map[i.productId].units += i.quantity
    map[i.productId].revenue += i.quantity * i.unitPrice
  }))
  return Object.values(map).sort((a, b) => b.units - a.units).slice(0, 5)
}

function computeChartData(orders: Order[]) {
  const map: Record<string, number> = {}
  orders.forEach(o => {
    const d = new Date(o.createdAt)
    const weekStart = new Date(d)
    weekStart.setHours(0, 0, 0, 0)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    map[key] = (map[key] || 0) + o.total
  })
  const entries = Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return []
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  return entries.map(([date, value]) => {
    const d = new Date(date)
    return { label: `${d.getDate()} ${months[d.getMonth()]}`, value }
  })
}

function formatDate(raw: unknown): string {
  try {
    const d = (raw as any)?.toDate ? (raw as any).toDate() : new Date(String(raw))
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
  } catch {
    return '—'
  }
}

// ─── Mini chart tooltip ────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-[#DFE1E8] bg-white px-3 py-2 shadow-lg text-xs">
      <p className="font-bold text-[#0B1A45]">{formatCurrency(payload[0].value)}</p>
    </div>
  )
}

// ─── Commission section ────────────────────────────────────────────────────────

function CommissionSection({
  commissions,
  commissionRate,
}: {
  commissions: (FirestoreCommission & { id: string })[]
  commissionRate: number
}) {
  const [showAll, setShowAll] = useState(false)

  const currentPeriod = new Date().toISOString().slice(0, 7)
  const pending = commissions.filter(c => c.status === 'pending' || c.status === 'overdue')
  const currentMonth = commissions.filter(c => c.period === currentPeriod)
  const pendingTotal = pending.reduce((s, c) => s + c.commissionAmount, 0)
  const monthTotal = currentMonth.reduce((s, c) => s + c.commissionAmount, 0)
  const paidTotal = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0)

  const allSorted = useMemo(() => [...commissions]
    .sort((a, b) => {
      const da = (a.createdAt as any)?.toDate?.()?.getTime?.() ?? new Date(String(a.createdAt)).getTime()
      const db = (b.createdAt as any)?.toDate?.()?.getTime?.() ?? new Date(String(b.createdAt)).getTime()
      return db - da
    }), [commissions])

  const displayed = showAll ? allSorted : allSorted.slice(0, 5)
  const hasMore = allSorted.length > 5

  const statusCfg: Record<string, { icon: React.ReactNode; label: string; badge: string }> = {
    paid: { icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />, label: 'Cobrado', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    overdue: { icon: <AlertTriangle className="h-3.5 w-3.5 text-red-500" />, label: 'Vencido', badge: 'bg-red-50 text-red-600 border-red-200' },
    waived: { icon: <XCircle className="h-3.5 w-3.5 text-gray-400" />, label: 'Saldado', badge: 'bg-gray-50 text-gray-500 border-gray-200' },
    pending: { icon: <Clock className="h-3.5 w-3.5 text-amber-500" />, label: 'Pendiente', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  }

  return (
    <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white shadow-[0_10px_30px_rgba(11,26,69,0.06)]">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 md:px-6 md:pt-6">
        <h2 className="font-heading text-lg font-bold tracking-tight text-[#0B1A45] md:text-xl">Comisión de plataforma</h2>
        <p className="mt-1 text-sm text-[#7A839C]">
          Se calcula sobre pedidos entregados · Tasa actual:{' '}
          <span className="font-semibold text-[#0B1A45]">{(commissionRate * 100).toFixed(1)}%</span>
        </p>
      </div>

      {/* 4 summary cards */}
      <div className="grid grid-cols-2 gap-2.5 px-4 pb-4 md:gap-3 md:px-6 md:pb-5 sm:grid-cols-4">
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50 px-3 py-3.5 md:px-4 md:py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-600">Por pagar</p>
          <p className="mt-1.5 font-heading text-xl font-bold tracking-tight text-amber-700 md:text-2xl">{formatCurrency(pendingTotal)}</p>
          <p className="mt-1 text-[11px] text-amber-600">Pendiente de abono</p>
        </div>
        <div className="rounded-2xl border border-[#DFE1E8]/70 bg-[#F7F8FA] px-3 py-3.5 md:px-4 md:py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A839C]">Este mes</p>
          <p className="mt-1.5 font-heading text-xl font-bold tracking-tight text-[#0B1A45] md:text-2xl">{formatCurrency(monthTotal)}</p>
          <p className="mt-1 text-[11px] text-[#7A839C]">Generado este mes</p>
        </div>
        <div className="rounded-2xl border border-[#D9EEA8] bg-[#F4FBE7] px-3 py-3.5 md:px-4 md:py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A662E]">Cobrado</p>
          <p className="mt-1.5 font-heading text-xl font-bold tracking-tight text-[#4A662E] md:text-2xl">{formatCurrency(paidTotal)}</p>
          <p className="mt-1 text-[11px] text-[#4A662E]">Total cobrado</p>
        </div>
        <div className="rounded-2xl border border-[#DFE1E8]/70 bg-[#F7F8FA] px-3 py-3.5 md:px-4 md:py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A839C]">Tasa actual</p>
          <p className="mt-1.5 font-heading text-xl font-bold tracking-tight text-[#0B1A45] md:text-2xl">{(commissionRate * 100).toFixed(1)}%</p>
          <p className="mt-1 text-[11px] text-[#7A839C]">Sobre pedidos entregados</p>
        </div>
      </div>

      {/* Info note */}
      <div className="mx-4 mb-4 flex items-start gap-2.5 rounded-2xl border border-[#DFE1E8]/60 bg-[#F7F8FA] px-3.5 py-3 text-[13px] leading-6 text-[#5F6880] md:mx-6 md:mb-5 md:px-4">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#7A839C]" />
        <p>La comisión se calcula sobre el valor de los pedidos entregados. Se abona directamente a tu cuenta registrada en StockIA.</p>
      </div>

      {/* Commission list — mobile cards / desktop table */}
      {commissions.length === 0 ? (
        <p className="px-4 pb-6 pt-1 text-center text-sm text-muted-foreground md:px-6">
          Las comisiones aparecerán aquí cuando se completen pedidos.
        </p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block px-6 pb-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DFE1E8]/60">
                  <th className="pb-2.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Pedido</th>
                  <th className="pb-2.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Fecha</th>
                  <th className="pb-2.5 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Venta</th>
                  <th className="pb-2.5 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">
                    Comisión ({(commissionRate * 100).toFixed(1)}%)
                  </th>
                  <th className="pb-2.5 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE1E8]/40">
                {displayed.map(c => {
                  const cfg = statusCfg[c.status] ?? statusCfg.pending
                  const orderLabel = (c as { orderNumber?: string }).orderNumber ?? String(c.orderId).slice(0, 8).toUpperCase()
                  return (
                    <tr key={c.id}>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {cfg.icon}
                          <span className="font-semibold text-[#0B1A45]">{orderLabel}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-[#7A839C]">{formatDate(c.createdAt)}</td>
                      <td className="py-3 pr-4 text-right font-medium text-[#0B1A45]">{formatCurrency(c.orderTotal)}</td>
                      <td className="py-3 pr-4 text-right font-bold text-[#0B1A45]">{formatCurrency(c.commissionAmount)}</td>
                      <td className="py-3 text-right">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="block sm:hidden px-4 pb-2 space-y-2">
            {displayed.map(c => {
              const cfg = statusCfg[c.status] ?? statusCfg.pending
              const orderLabel = (c as { orderNumber?: string }).orderNumber ?? String(c.orderId).slice(0, 8).toUpperCase()
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-[#DFE1E8]/70 bg-[#FAFBFC] px-3.5 py-3">
                  <div className="shrink-0">{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0B1A45] truncate">{orderLabel}</p>
                    <p className="mt-0.5 text-[11px] text-[#7A839C]">{formatDate(c.createdAt)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-[#0B1A45]">{formatCurrency(c.commissionAmount)}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold mt-0.5 ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Expand / collapse footer */}
          {hasMore && (
            <div className="flex justify-center border-t border-[#DFE1E8]/60 px-4 py-4 md:px-6">
              <button
                onClick={() => setShowAll(v => !v)}
                className="flex items-center gap-1.5 text-sm font-semibold text-[#0B1A45] hover:text-[#4A662E] transition-colors"
              >
                {showAll ? (
                  <>Mostrar menos <ChevronUp className="h-3.5 w-3.5" /></>
                ) : (
                  <>Ver todas las comisiones <ArrowRight className="h-3.5 w-3.5" /></>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VentasPage() {
  const { currentUser, distribuidoraOrders: orders, distribuidoraOrdersLoading: ordersLoading } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const distId = distribuidora?.id || ''
  const commissionRate = distribuidora?.commissionRate ?? 0.015
  const commissionStatus = distribuidora?.commissionStatus ?? 'ok'

  const [commissions, setCommissions] = useState<(FirestoreCommission & { id: string })[]>([])
  const [commissionsLoading, setCommissionsLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('all')
  const [showAllOrders, setShowAllOrders] = useState(false)

  useEffect(() => {
    if (!distId) { setCommissions([]); setCommissionsLoading(false); return }
    let mounted = true
    setCommissionsLoading(true)
    getCommissionsByDistributor(distId)
      .then(r => { if (mounted) { setCommissions(r); setCommissionsLoading(false) } })
      .catch(() => { if (mounted) { setCommissions([]); setCommissionsLoading(false) } })
    return () => { mounted = false }
  }, [distId])

  const filteredOrders = useMemo(() => filterOrdersByPeriod(orders, period), [orders, period])
  const kpis = useMemo(() => computeKPIs(filteredOrders), [filteredOrders])
  const topProducts = useMemo(() => computeTopProducts(filteredOrders), [filteredOrders])
  const chartData = useMemo(() => computeChartData(filteredOrders), [filteredOrders])

  const allOrdersSorted = useMemo(() =>
    [...filteredOrders].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [filteredOrders]
  )
  const displayedOrders = showAllOrders ? allOrdersSorted : allOrdersSorted.slice(0, 6)
  const hasMoreOrders = allOrdersSorted.length > 6

  const isBlocked = commissionStatus === 'blocked'
  const maxRevenue = topProducts[0]?.revenue ?? 1

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA]">
      {/* ── Header ── */}
      <header className="border-b border-[#DFE1E8]/80 bg-white px-4 pb-4 pt-4 md:px-8 md:pt-5">
        <div className="mx-auto max-w-[1240px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Panel comercial</p>
          <div className="mt-1.5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-[#0B1A45] md:text-3xl">Ventas</h1>
              <p className="mt-0.5 text-sm text-[#7A839C]">Métricas y actividad comercial de tu distribuidora.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Period filters */}
              <button
                onClick={() => setPeriod('month')}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium shadow-sm transition-all ${
                  period === 'month'
                    ? 'border-[#0B1A45] bg-[#0B1A45] text-white'
                    : 'border-[#DFE1E8] bg-white text-[#5F6880] hover:border-[#0B1A45]/30 hover:text-[#0B1A45]'
                }`}
              >
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <rect x="1" y="2" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M1 5h12" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M4 1v2M10 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Este mes
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium shadow-sm transition-all ${
                  period === 'all'
                    ? 'border-[#0B1A45] bg-[#0B1A45] text-white'
                    : 'border-[#DFE1E8] bg-white text-[#5F6880] hover:border-[#0B1A45]/30 hover:text-[#0B1A45]'
                }`}
              >
                Total histórico
              </button>
              <div className="flex items-center gap-1.5 rounded-full border border-[#C8FF00]/30 bg-[#F1FFD1] px-3.5 py-2 text-xs font-bold text-[#4A662E]">
                <TrendingUp className="h-3.5 w-3.5" />
                {(commissionRate * 100).toFixed(1)}% comisión actual
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-6 md:px-8">
        {isBlocked && (
          <div className="mb-5 flex items-start gap-3 rounded-3xl border border-red-200/80 bg-red-50 px-5 py-4 text-red-900 shadow-[0_8px_20px_rgba(239,68,68,0.08)]">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-bold">Tu cuenta está bloqueada por comisiones vencidas</p>
              <p className="mt-1 text-sm leading-6 text-red-800">No podés publicar productos ni recibir nuevos pedidos. Contactá a StockIA para resolver la situación.</p>
            </div>
          </div>
        )}

        {ordersLoading || commissionsLoading ? (
          <SalesDashboardSkeleton />
        ) : (
          <div className="flex flex-col gap-5">

            {/* ── Resumen comercial ── */}
            <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white shadow-[0_10px_30px_rgba(11,26,69,0.06)]">
              <div className="p-4 pb-4 md:p-6 md:pb-5">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-heading text-lg font-bold tracking-tight text-[#0B1A45] md:text-xl">Resumen comercial</h2>
                  <div className="flex items-center gap-1.5 rounded-full border border-[#89B317]/20 bg-[#F1FFD1] px-3 py-1.5 text-xs font-bold text-[#4A662E]">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {kpis.completed} {kpis.completed === 1 ? 'pedido entregado' : 'pedidos entregados'}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
                  <div className="shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Facturación total</p>
                    <p className="mt-1.5 font-heading text-3xl font-bold tracking-tight text-[#0B1A45] md:text-5xl">
                      {formatCurrency(kpis.total)}
                    </p>
                    <p className="mt-2 max-w-[280px] text-sm leading-6 text-[#7A839C]">
                      Total registrado y lectura rápida del rendimiento comercial.
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    {chartData.length > 1 ? (
                      <div className="h-[110px] w-full md:h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F5" vertical={false} />
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 10, fill: '#7A839C', fontFamily: 'var(--font-jakarta)' }}
                              axisLine={false}
                              tickLine={false}
                              interval="preserveStartEnd"
                            />
                            <YAxis
                              tick={{ fontSize: 10, fill: '#7A839C', fontFamily: 'var(--font-jakarta)' }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                              width={36}
                            />
                            <Tooltip content={<ChartTooltip />} />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#89B317"
                              strokeWidth={2}
                              dot={{ fill: '#89B317', r: 3, strokeWidth: 0 }}
                              activeDot={{ r: 5, fill: '#4A662E', strokeWidth: 0 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-[100px] w-full rounded-2xl border border-dashed border-[#DFE1E8] bg-[#F7F8FA]" />
                    )}
                  </div>
                </div>
              </div>

              {/* 4 KPI cards */}
              <div className="grid grid-cols-2 gap-2.5 border-t border-[#DFE1E8]/60 p-4 md:gap-3 md:grid-cols-4 md:p-5">
                {[
                  { label: 'Ventas totales', value: formatCurrency(kpis.total), icon: TrendingUp, delta: '+12.6%', accent: 'text-[#4A662E]', bg: 'bg-[#F1FFD1]' },
                  { label: 'Pedidos completados', value: String(kpis.completed), icon: ShoppingBag, delta: '+2', accent: 'text-[#0B1A45]', bg: 'bg-[#F7F8FA]' },
                  { label: 'Ticket promedio', value: formatCurrency(kpis.avg), icon: Receipt, delta: '+8.4%', accent: 'text-[#0B1A45]', bg: 'bg-[#F7F8FA]' },
                  { label: 'Unidades vendidas', value: String(kpis.units), icon: Package, delta: '+15.7%', accent: 'text-[#4A662E]', bg: 'bg-[#F4FBE7]' },
                ].map(({ label, value, icon: Icon, delta, accent, bg }) => (
                  <div key={label} className="rounded-2xl border border-[#DFE1E8]/70 bg-[#FAFBFC] p-3.5 md:p-4">
                    <div className={`mb-2.5 flex h-8 w-8 items-center justify-center rounded-xl ${bg} md:h-9 md:w-9`}>
                      <Icon className={`h-4 w-4 ${accent}`} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A839C]">{label}</p>
                    <p className="mt-1 font-heading text-lg font-bold text-[#0B1A45] md:text-2xl">{value}</p>
                    <p className="mt-1 text-[11px] font-semibold text-[#4A662E]">{delta} vs. periodo anterior</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Commission section ── */}
            <CommissionSection commissions={commissions} commissionRate={commissionRate} />

            {/* ── Bottom 2-col ── */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

              {/* Ventas recientes — 2/3 */}
              <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white shadow-[0_10px_30px_rgba(11,26,69,0.06)] md:col-span-2">
                <div className="px-4 pt-5 pb-4 md:px-6 md:pt-6">
                  <h2 className="font-heading text-lg font-bold tracking-tight text-[#0B1A45] md:text-xl">Ventas recientes</h2>
                </div>

                {allOrdersSorted.length === 0 ? (
                  <div className="mx-4 mb-5 rounded-3xl border border-dashed border-[#DFE1E8] bg-[#F7F8FA] px-6 py-10 text-center md:mx-6">
                    <p className="font-bold text-[#0B1A45]">Sin ventas registradas</p>
                    <p className="mt-2 text-sm text-[#7A839C]">Cuando ingresen pedidos, vas a poder seguirlos desde acá.</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop table */}
                    <div className="hidden sm:block overflow-x-auto px-6">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#DFE1E8]/60">
                            <th className="pb-2.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Cliente</th>
                            <th className="pb-2.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Pedido</th>
                            <th className="pb-2.5 text-left text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Fecha</th>
                            <th className="pb-2.5 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Venta</th>
                            <th className="pb-2.5 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Estado</th>
                            <th className="pb-2.5 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#DFE1E8]/40">
                          {displayedOrders.map(o => (
                            <tr key={o.id} className="hover:bg-[#FAFBFC] transition-colors">
                              <td className="py-3 pr-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B1A45] font-heading text-xs font-bold text-white">
                                    {o.comercioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-medium text-[#0B1A45] whitespace-nowrap">{o.comercioName}</span>
                                </div>
                              </td>
                              <td className="py-3 pr-3 font-mono text-xs text-[#7A839C]">{o.orderNumber}</td>
                              <td className="py-3 pr-3 text-[#7A839C] whitespace-nowrap text-xs">
                                {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                              <td className="py-3 pr-3 text-right font-heading font-bold text-[#0B1A45]">{formatCurrency(o.total)}</td>
                              <td className="py-3 pr-3 text-center">
                                <StatusBadge status={o.firestoreStatus ?? (o.status as any)} className="text-[10px]" />
                              </td>
                              <td className="py-3 text-right">
                                <Link
                                  href={`/distribuidora/pedidos/${o.id}`}
                                  className="flex items-center gap-0.5 ml-auto text-xs font-semibold text-[#0B1A45] hover:text-[#4A662E] transition-colors whitespace-nowrap"
                                >
                                  Ver detalle <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="block sm:hidden px-4 space-y-2">
                      {displayedOrders.map(o => (
                        <Link
                          key={o.id}
                          href={`/distribuidora/pedidos/${o.id}`}
                          className="flex items-center gap-3 rounded-2xl border border-[#DFE1E8]/70 bg-[#FAFBFC] px-3.5 py-3 hover:border-[#0B1A45]/20 hover:shadow-sm transition-all"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B1A45] font-heading text-xs font-bold text-white">
                            {o.comercioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[#0B1A45] truncate">{o.comercioName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-[11px] text-[#7A839C]">{o.orderNumber}</p>
                              <span className="text-[#DFE1E8]">·</span>
                              <p className="text-[11px] text-[#7A839C]">
                                {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-heading font-bold text-sm text-[#0B1A45]">{formatCurrency(o.total)}</p>
                            <div className="mt-0.5">
                              <StatusBadge status={o.firestoreStatus ?? (o.status as any)} className="text-[10px]" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Expand footer */}
                    {hasMoreOrders && (
                      <div className="flex justify-center border-t border-[#DFE1E8]/60 px-4 py-4 mt-2 md:px-6">
                        <button
                          onClick={() => setShowAllOrders(v => !v)}
                          className="flex items-center gap-1.5 text-sm font-semibold text-[#0B1A45] hover:text-[#4A662E] transition-colors"
                        >
                          {showAllOrders ? (
                            <>Mostrar menos <ChevronUp className="h-3.5 w-3.5" /></>
                          ) : (
                            <>Ver todas las ventas <ArrowRight className="h-3.5 w-3.5" /></>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              {/* Más vendidos — 1/3 */}
              <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white shadow-[0_10px_30px_rgba(11,26,69,0.06)]">
                <div className="px-4 pt-5 pb-4 md:px-6 md:pt-6">
                  <h2 className="font-heading text-lg font-bold tracking-tight text-[#0B1A45] md:text-xl">Más vendidos</h2>
                </div>

                {topProducts.length === 0 ? (
                  <div className="mx-4 mb-5 rounded-3xl border border-dashed border-[#DFE1E8] bg-[#F7F8FA] px-5 py-8 text-center md:mx-6">
                    <p className="font-bold text-[#0B1A45]">Sin datos</p>
                    <p className="mt-2 text-sm text-[#7A839C]">Cuando se registren ventas, acá vas a ver qué productos se mueven mejor.</p>
                  </div>
                ) : (
                  <div className="px-4 pb-5 md:px-6">
                    {/* Column header */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 pb-2 border-b border-[#DFE1E8]/60 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7A839C]">
                      <span />
                      <span>Producto</span>
                      <span className="text-right">Uds.</span>
                      <span className="text-right">Ingresos</span>
                    </div>
                    <div className="divide-y divide-[#DFE1E8]/40">
                      {topProducts.map((p, i) => (
                        <div key={p.name} className="py-3">
                          <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-x-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F1FFD1] text-[11px] font-bold text-[#4A662E]">
                              {i + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#0B1A45]">{p.name}</p>
                              <p className="text-[11px] text-[#7A839C]">{p.units} unidades</p>
                            </div>
                            <p className="text-right text-xs font-medium text-[#7A839C]">{p.units}</p>
                            <p className="text-right text-xs font-bold text-[#0B1A45]">{formatCurrency(p.revenue)}</p>
                          </div>
                          <div className="mt-2 ml-10 h-1.5 overflow-hidden rounded-full bg-[#F0F1F5]">
                            <div
                              className="h-full rounded-full bg-[#89B317] transition-all"
                              style={{ width: `${Math.round((p.revenue / maxRevenue) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
