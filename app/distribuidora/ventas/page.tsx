'use client'

import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, ShoppingBag, Receipt, Package, AlertTriangle, Clock, CheckCircle2, XCircle, Percent } from 'lucide-react'
import { formatCurrency } from '@/lib/mock-data'
import { StatusBadge } from '@/components/status-badge'
import { SalesDashboardSkeleton } from '@/components/ui/SkeletonCard'
import { useApp } from '@/lib/app-context'
import { Distribuidora, type Order } from '@/lib/types'
import { getCommissionsByDistributor, type FirestoreCommission } from '@/lib/data/commissions.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function formatPeriod(period: string): string {
  if (!period || !period.includes('-')) return period
  const [year, month] = period.split('-')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${months[parseInt(month) - 1]} ${year}`
}

// ─── Commission section ────────────────────────────────────────────────────────

function CommissionSection({
  commissions,
  commissionRate,
}: {
  commissions: (FirestoreCommission & { id: string })[]
  commissionRate: number
}) {
  const currentPeriod = new Date().toISOString().slice(0, 7)
  const pending = commissions.filter(c => c.status === 'pending' || c.status === 'overdue')
  const currentMonth = commissions.filter(c => c.period === currentPeriod)
  const pendingTotal = pending.reduce((s, c) => s + c.commissionAmount, 0)
  const monthTotal = currentMonth.reduce((s, c) => s + c.commissionAmount, 0)
  const paidTotal = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0)

  const recent = useMemo(() => [...commissions]
    .sort((a, b) => {
      const da = (a.createdAt as any)?.toDate?.()?.getTime?.() ?? new Date(String(a.createdAt)).getTime()
      const db = (b.createdAt as any)?.toDate?.()?.getTime?.() ?? new Date(String(b.createdAt)).getTime()
      return db - da
    })
    .slice(0, 5), [commissions])

  const statusIcon = (s: string) => {
    if (s === 'paid') return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    if (s === 'overdue') return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
    if (s === 'waived') return <XCircle className="h-3.5 w-3.5 text-gray-400" />
    return <Clock className="h-3.5 w-3.5 text-amber-500" />
  }

  const statusLabel: Record<string, string> = {
    pending: 'Pendiente', paid: 'Cobrada', overdue: 'Vencida', waived: 'Saldada',
  }

  return (
    <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_10px_30px_rgba(11,26,69,0.06)] md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Comisiones</p>
          <h2 className="mt-1 font-heading text-xl font-bold tracking-tight text-[#0B1A45]">Comisión de plataforma</h2>
          <p className="mt-1.5 text-sm leading-6 text-[#7A839C]">
            Se calcula sobre pedidos entregados · Tasa actual: <span className="font-semibold">{(commissionRate * 100).toFixed(1)}%</span>
          </p>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1FFD1] text-[#4A662E]">
          <Percent className="h-4.5 w-4.5" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Por pagar',
            value: formatCurrency(pendingTotal),
            tone: 'bg-amber-50 text-amber-800 border-amber-200/60',
          },
          {
            label: 'Este mes',
            value: formatCurrency(monthTotal),
            tone: 'bg-[#F7F8FA] text-[#0B1A45] border-[#DFE1E8]/70',
          },
          {
            label: 'Cobrado',
            value: formatCurrency(paidTotal),
            tone: 'bg-[#F4FBE7] text-[#4A662E] border-[#D9EEA8]',
          },
        ].map((item) => (
          <div key={item.label} className={`rounded-2xl border px-4 py-3.5 ${item.tone}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em]">{item.label}</p>
            <p className="mt-2 font-heading text-2xl font-bold tracking-tight">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[#F7F8FA] p-4 text-sm leading-6 text-[#5F6880]">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#7A839C]" />
        <p>
          El pago entre tu distribuidora y los comercios se coordina por fuera de la plataforma.
          StockIA registra una comisión por cada pedido entregado que se abona directamente al equipo de StockIA.
        </p>
      </div>

      {recent.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Últimas comisiones</p>
          <div className="space-y-2">
            {recent.map(c => (
              <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-[#DFE1E8]/70 bg-white px-3 py-3 last:border-[#DFE1E8]/70">
                <div className="shrink-0">{statusIcon(c.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Pedido {(c as { orderNumber?: string }).orderNumber ?? String(c.orderId).slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{formatPeriod(c.period)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(c.commissionAmount)}</p>
                  <p className="text-[11px] text-muted-foreground">{statusLabel[c.status] ?? c.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {commissions.length === 0 && (
        <p className="py-6 text-center text-sm text-muted-foreground">
          Las comisiones aparecerán aquí cuando se completen pedidos.
        </p>
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

  useEffect(() => {
    if (!distId) {
      setCommissions([])
      setCommissionsLoading(false)
      return
    }

    let mounted = true
    setCommissionsLoading(true)
    getCommissionsByDistributor(distId)
      .then(result => {
        if (!mounted) return
        setCommissions(result)
        setCommissionsLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setCommissions([])
        setCommissionsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [distId])

  const kpis = useMemo(() => computeKPIs(orders), [orders])
  const topProducts = useMemo(() => computeTopProducts(orders), [orders])
  const recentOrders = useMemo(() => [...orders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6), [orders])

  const isBlocked = commissionStatus === 'blocked'

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-[#DFE1E8]/80 bg-white/95 px-4 pb-4 pt-4 backdrop-blur-sm md:px-8 md:pt-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Panel comercial</p>
          <div className="mt-1 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-heading font-bold text-2xl tracking-tight text-[#0B1A45] md:text-3xl">Ventas</h1>
              <p className="mt-1 text-sm text-muted-foreground">Métricas y actividad comercial de tu distribuidora.</p>
            </div>
            <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#C8FF00]/20 bg-[#F1FFD1] px-3 py-1.5 text-xs font-bold text-[#4A662E]">
              <Percent className="h-3.5 w-3.5" />
              {(commissionRate * 100).toFixed(1)}% comisión actual
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-16 pt-6 md:px-8 max-w-5xl mx-auto w-full">
        {isBlocked && (
          <div className="mb-4 flex items-start gap-3 rounded-3xl border border-red-200/80 bg-red-50 px-4 py-4 text-red-900 shadow-[0_8px_20px_rgba(239,68,68,0.08)]">
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
          <>
            <section className="mb-6 bg-white rounded-3xl border border-[#DFE1E8]/80 shadow-[0_10px_30px_rgba(11,26,69,0.06)] p-5 md:p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Resumen</p>
                  <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#0B1A45] md:text-4xl">{formatCurrency(kpis.total)}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-[#7A839C]">Facturación total registrada y lectura rápida del rendimiento comercial.</p>
                </div>
                <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-[#89B317]/20 bg-[#F1FFD1] px-3 py-1.5 text-xs font-bold text-[#4A662E]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  {kpis.completed} {kpis.completed === 1 ? 'pedido entregado' : 'pedidos entregados'}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Ventas totales', value: formatCurrency(kpis.total), icon: TrendingUp, accent: 'text-[#4A662E]', bg: 'bg-[#F1FFD1]' },
                  { label: 'Pedidos completados', value: String(kpis.completed), icon: ShoppingBag, accent: 'text-[#0B1A45]', bg: 'bg-[#F7F8FA]' },
                  { label: 'Ticket promedio', value: formatCurrency(kpis.avg), icon: Receipt, accent: 'text-[#0B1A45]', bg: 'bg-[#F7F8FA]' },
                  { label: 'Unidades vendidas', value: String(kpis.units), icon: Package, accent: 'text-[#4A662E]', bg: 'bg-[#F4FBE7]' },
                ].map(({ label, value, icon: Icon, accent, bg }) => (
                  <div key={label} className="bg-[#FAFBFC] rounded-2xl border border-[#DFE1E8]/70 p-4">
                    <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                      <Icon className={`h-4 w-4 ${accent}`} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">{label}</p>
                    <p className="mt-1.5 font-heading font-bold text-xl md:text-2xl text-[#0B1A45]">{value}</p>
                  </div>
                ))}
              </div>
            </section>

            <CommissionSection commissions={commissions} commissionRate={commissionRate} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              <section className="md:col-span-2 bg-white rounded-3xl border border-[#DFE1E8]/80 shadow-[0_10px_30px_rgba(11,26,69,0.06)] p-5 md:p-6">
                <div className="mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Actividad</p>
                  <h2 className="mt-1 font-heading text-xl font-bold tracking-tight text-[#0B1A45]">Ventas recientes</h2>
                </div>
                <div className="space-y-3">
                  {recentOrders.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-[#DFE1E8] bg-[#F7F8FA] px-6 py-10 text-center">
                      <p className="font-bold text-[#0B1A45]">Sin ventas registradas</p>
                      <p className="mt-2 text-sm text-[#7A839C]">Cuando ingresen pedidos, vas a poder seguirlos desde acá.</p>
                    </div>
                  ) : (
                    recentOrders.map(o => (
                      <div key={o.id} className="flex items-center gap-3 rounded-2xl border border-[#DFE1E8]/70 bg-[#FBFBFC] p-3.5 transition-[border-color,box-shadow] duration-200 hover:border-[#0B1A45]/15 hover:shadow-[0_8px_20px_rgba(11,26,69,0.06)]">
                        <div className="h-10 w-10 rounded-xl bg-[#0B1A45] flex items-center justify-center font-heading font-bold text-sm text-white shrink-0">
                          {o.comercioName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">{o.comercioName}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {o.orderNumber} · {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-heading font-bold text-sm md:text-base text-[#0B1A45]">{formatCurrency(o.total)}</p>
                          <StatusBadge status={o.firestoreStatus ?? (o.status as any)} className="text-[10px] mt-1" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-[#DFE1E8]/80 shadow-[0_10px_30px_rgba(11,26,69,0.06)] p-5">
                <div className="mb-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Productos</p>
                  <h2 className="mt-1 font-heading text-xl font-bold tracking-tight text-[#0B1A45]">Más vendidos</h2>
                </div>
                {topProducts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-[#DFE1E8] bg-[#F7F8FA] px-5 py-8 text-center">
                    <p className="font-bold text-[#0B1A45]">Sin datos</p>
                    <p className="mt-2 text-sm text-[#7A839C]">Cuando se registren ventas, acá vas a ver qué productos se mueven mejor.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3 rounded-2xl border border-[#DFE1E8]/70 bg-[#FBFBFC] px-3 py-3">
                        <span className="text-xs font-bold text-[#4A662E] bg-[#F1FFD1] rounded-xl h-8 w-8 flex items-center justify-center shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{p.units} unidades</p>
                        </div>
                        <p className="text-xs font-bold text-[#0B1A45] shrink-0">{formatCurrency(p.revenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
