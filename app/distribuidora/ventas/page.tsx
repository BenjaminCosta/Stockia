'use client'

import { useState } from 'react'
import { TrendingUp, ShoppingBag, Receipt, Package, Info, CheckCircle2, Clock, Truck } from 'lucide-react'
import { mockOrders, formatCurrency } from '@/lib/mock-data'
import { StatusBadge } from '@/components/status-badge'
import { useApp } from '@/lib/app-context'
import { Distribuidora } from '@/lib/types'

// Usamos mockOrders directamente — ya contiene todos los pedidos de todas las distribuidoras
const allOrders = mockOrders

type Period = 'hoy' | 'semana' | 'mes'

function computeKPIs(orders: typeof allOrders) {
  const total = orders.reduce((s, o) => s + o.total, 0)
  const completed = orders.filter(o => o.status === 'entregado').length
  const avg = orders.length > 0 ? Math.round(total / orders.length) : 0
  const units = orders.flatMap(o => o.items).reduce((s, i) => s + i.quantity, 0)
  return { total, completed, avg, units, count: orders.length }
}

function computeTopProducts(orders: typeof allOrders) {
  const map: Record<string, { name: string; units: number; revenue: number }> = {}
  orders.forEach(o => o.items.forEach(i => {
    if (!map[i.productId]) map[i.productId] = { name: i.productName, units: 0, revenue: 0 }
    map[i.productId].units += i.quantity
    map[i.productId].revenue += i.quantity * i.unitPrice
  }))
  return Object.values(map).sort((a, b) => b.units - a.units).slice(0, 5)
}

const statusGroups = [
  { status: 'pagado', label: 'Pagados', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50' },
  { status: 'en_preparacion', label: 'En preparación', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  { status: 'entregado', label: 'Entregados', icon: Truck, color: 'text-green-600', bg: 'bg-green-50' },
]

export default function VentasPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const distId = distribuidora?.id || 'dist-1'

  const [period, setPeriod] = useState<Period>('mes')

  // In a real app we'd filter by date; for proto we show all orders for this distribuidora
  const orders = allOrders.filter(o => o.distribuidoraId === distId)
  const kpis = computeKPIs(orders)
  const topProducts = computeTopProducts(orders)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-5 md:pt-6 pb-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading font-bold text-2xl text-foreground">Ventas</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Métricas y actividad comercial de tu distribuidora.</p>
            </div>
            {/* Period selector */}
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              {(['hoy', 'semana', 'mes'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                    period === p ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : 'Mes'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="px-4 md:px-8 pt-6 pb-16 max-w-5xl mx-auto w-full">

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Ventas totales', value: formatCurrency(kpis.total), icon: TrendingUp, accent: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pedidos completados', value: String(kpis.completed), icon: ShoppingBag, accent: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Ticket promedio', value: formatCurrency(kpis.avg), icon: Receipt, accent: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Unidades vendidas', value: String(kpis.units), icon: Package, accent: 'text-primary', bg: 'bg-primary/10' },
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Recent orders — 2/3 width */}
          <div className="md:col-span-2 bg-white rounded-3xl border border-border shadow-sm p-5 md:p-6">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">Ventas recientes</h2>
            <div className="space-y-3">
              {orders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin ventas en el período</p>
              ) : (
                orders.map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="h-10 w-10 rounded-xl bg-sidebar flex items-center justify-center font-heading font-bold text-sm text-white shrink-0">
                      {o.comercioName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">{o.comercioName}</p>
                      <p className="text-xs text-muted-foreground">{o.orderNumber} · {new Date(o.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</p>
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

          {/* Right column */}
          <div className="flex flex-col gap-5">
            {/* Status breakdown */}
            <div className="bg-white rounded-3xl border border-border shadow-sm p-5">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">Por estado</h2>
              <div className="space-y-2.5">
                {statusGroups.map(({ status, label, icon: Icon, color, bg }) => {
                  const count = orders.filter(o => o.status === status).length
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-foreground">{label}</p>
                      </div>
                      <span className={`font-heading font-bold text-base ${color}`}>{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Top products */}
            <div className="bg-white rounded-3xl border border-border shadow-sm p-5 flex-1">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">Más vendidos</h2>
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
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-5 flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-700">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>Estos datos son estimativos y funcionan con mock data para el prototipo. No representan ventas reales.</span>
        </div>
      </div>
    </div>
  )
}
