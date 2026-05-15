'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, ShoppingBag, Receipt, Package, AlertTriangle, Clock, CheckCircle2, XCircle, Percent } from 'lucide-react'
import { formatCurrency } from '@/lib/mock-data'
import { StatusBadge } from '@/components/status-badge'
import { useApp } from '@/lib/app-context'
import { useDistribuidoraOrders } from '@/hooks/use-data'
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

  const recent = [...commissions]
    .sort((a, b) => {
      const da = (a.createdAt as any)?.toDate?.()?.getTime?.() ?? new Date(String(a.createdAt)).getTime()
      const db = (b.createdAt as any)?.toDate?.()?.getTime?.() ?? new Date(String(b.createdAt)).getTime()
      return db - da
    })
    .slice(0, 5)

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
    <div className="bg-white rounded-3xl border border-border shadow-sm p-5 md:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Comisión de plataforma</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Se calcula sobre pedidos entregados · Tasa actual: <span className="font-semibold">{(commissionRate * 100).toFixed(1)}%</span>
          </p>
        </div>
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Percent className="h-4 w-4 text-primary" />
        </div>
      </div>

      {/* Summary grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide mb-1">Por pagar</p>
          <p className="font-heading font-bold text-base text-amber-700">{formatCurrency(pendingTotal)}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1">Este mes</p>
          <p className="font-heading font-bold text-base text-blue-700">{formatCurrency(monthTotal)}</p>
        </div>
        <div className="bg-green-50 rounded-2xl p-3 text-center">
          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide mb-1">Cobrado</p>
          <p className="font-heading font-bold text-base text-green-700">{formatCurrency(paidTotal)}</p>
        </div>
      </div>

      {/* Explanation callout */}
      <div className="flex items-start gap-3 bg-gray-50 rounded-2xl p-4 text-xs text-gray-600">
        <AlertTriangle className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          El pago entre tu distribuidora y los comercios se coordina por fuera de la plataforma.
          Stockia registra una comisión por cada pedido entregado que se abona directamente al equipo de Stockia.
        </p>
      </div>

      {/* Recent commissions */}
      {recent.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Últimas comisiones</p>
          <div className="space-y-2">
            {recent.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="shrink-0">{statusIcon(c.status)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    Pedido {c.orderNumber ?? String(c.orderId).slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{formatPeriod(c.period)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-foreground">{formatCurrency(c.commissionAmount)}</p>
                  <p className="text-[10px] text-muted-foreground">{statusLabel[c.status] ?? c.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {commissions.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3">
          Las comisiones aparecerán aquí cuando se completen pedidos.
        </p>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VentasPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const distId = distribuidora?.id || ''
  const commissionRate = distribuidora?.commissionRate ?? 0.015
  const commissionStatus = distribuidora?.commissionStatus ?? 'ok'

  const { data: orders } = useDistribuidoraOrders(distId)
  const [commissions, setCommissions] = useState<(FirestoreCommission & { id: string })[]>([])

  useEffect(() => {
    if (!distId) return
    getCommissionsByDistributor(distId).then(setCommissions)
  }, [distId])

  const kpis = computeKPIs(orders)
  const topProducts = computeTopProducts(orders)

  const isBlocked = commissionStatus === 'blocked'

  return (
    <div className="flex flex-col min-h-screen">
      {/* Blocked warning */}
      {isBlocked && (
        <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Tu cuenta está bloqueada por comisiones vencidas</p>
            <p className="text-xs text-red-100 mt-0.5">No podés publicar productos ni recibir nuevos pedidos. Contactá a Stockia para resolver la situación.</p>
          </div>
        </div>
      )}

      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-5 md:pt-6 pb-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-foreground">Ventas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Métricas y actividad comercial de tu distribuidora.</p>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-8 pt-6 pb-16 max-w-5xl mx-auto w-full space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Ventas totales',      value: formatCurrency(kpis.total),   icon: TrendingUp, accent: 'text-green-600',   bg: 'bg-green-50' },
            { label: 'Pedidos completados', value: String(kpis.completed),        icon: ShoppingBag, accent: 'text-blue-600',  bg: 'bg-blue-50' },
            { label: 'Ticket promedio',     value: formatCurrency(kpis.avg),      icon: Receipt,    accent: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Unidades vendidas',   value: String(kpis.units),            icon: Package,    accent: 'text-primary',    bg: 'bg-primary/10' },
          ].map(({ label, value, icon: Icon, accent, bg }) => (
            <div key={label} className="bg-white rounded-2xl border border-border shadow-sm p-4">
              <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`h-5 w-5 ${accent}`} />
              </div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
              <p className="font-heading font-bold text-xl text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Commission section */}
        <CommissionSection commissions={commissions} commissionRate={commissionRate} />

        {/* Orders + products grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Recent orders — 2/3 width */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-border shadow-sm p-5 md:p-6">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">Ventas recientes</h2>
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin ventas registradas</p>
              ) : (
                orders.map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="h-10 w-10 rounded-xl bg-sidebar flex items-center justify-center font-heading font-bold text-sm text-white shrink-0">
                      {o.comercioName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{o.comercioName}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.orderNumber} · {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm text-foreground">{formatCurrency(o.total)}</p>
                      <StatusBadge status={o.status as any} className="text-[10px] mt-0.5" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Top products */}
          <div className="bg-white rounded-3xl border border-border shadow-sm p-5">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">Más vendidos</h2>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.units} unidades</p>
                    </div>
                    <p className="text-xs font-bold text-foreground shrink-0">{formatCurrency(p.revenue)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
