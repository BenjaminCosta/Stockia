'use client'

import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'
import {
  TrendingUp, TrendingDown, Package, Clock, CheckCircle, AlertCircle,
  ShoppingCart, ChevronRight, ClipboardList, Database, MapPin, Star,
} from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { InternalHeaderBackground } from '@/components/internal-header-background'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useProducts } from '@/hooks/use-data'
import { Distribuidora, Order, DistributorRatingSummary } from '@/lib/types'
import { DistribuidoraDashboardSkeleton } from '@/components/ui/SkeletonCard'
import { getDistributorRatingSummary } from '@/lib/data/reviews.service'

const LOW_STOCK_THRESHOLD = 10
const NON_SELLABLE_ORDER_STATUSES = new Set(['cancelled', 'not_delivered'])

function isToday(dateValue: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

function isYesterday(dateValue: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  )
}

function isThisMonth(dateValue: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth()
}

function isLastMonth(dateValue: string) {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  const lm = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  return date.getFullYear() === lm.getFullYear() && date.getMonth() === lm.getMonth()
}

function isSellableOrder(order: Order) {
  return !NON_SELLABLE_ORDER_STATUSES.has(order.firestoreStatus ?? order.status)
}

function growthLabel(current: number, previous: number): { pct: number; up: boolean } | null {
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  return { pct: Math.abs(pct), up: pct >= 0 }
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) {
    return (
      <svg viewBox="0 0 90 28" className="w-full h-full" fill="none">
        <path d="M0 14 L90 14" stroke="#DFE1E8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  }
  const max = Math.max(...points, 1)
  const min = Math.min(...points)
  const range = max - min || 1
  const w = 90
  const h = 28
  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x} ${y}`
  })
  const d = `M${coords.join(' L')}`
  const last = coords[coords.length - 1].split(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" fill="none">
      <path d={d} stroke="#89B317" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="#89B317" />
    </svg>
  )
}

export default function DistribuidoraDashboardPage() {
  const { currentUser, distribuidoraOrders: orders, distribuidoraOrdersLoading: ordersLoading } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const companyName = distribuidora?.companyName || 'Mi distribuidora'

  const distId = distribuidora?.id || 'dist-1'
  const { data: products, loading: productsLoading } = useProducts(distId)
  const isLoading = ordersLoading || productsLoading

  const [ratingSummary, setRatingSummary] = useState<DistributorRatingSummary | null>(null)
  useEffect(() => {
    if (!distId) return
    getDistributorRatingSummary(distId).then(s => setRatingSummary(s)).catch(() => {})
  }, [distId])

  const { recentOrders, lowStockCount, kpis, sparklinePoints } = useMemo(() => {
    const recent = [...orders]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3)

    const catalogProducts = products.filter(p => p.status !== 'paused')
    const lowStock = catalogProducts.filter(p => p.stock <= LOW_STOCK_THRESHOLD)
    const healthyCount = catalogProducts.filter(p => p.stock > LOW_STOCK_THRESHOLD).length
    const coverage = catalogProducts.length > 0
      ? Math.round((healthyCount / catalogProducts.length) * 100)
      : null

    const todayOrders = orders.filter(o => isToday(o.createdAt))
    const yesterdayOrders = orders.filter(o => isYesterday(o.createdAt))
    const monthOrders = orders.filter(o => isThisMonth(o.createdAt))
    const lastMonthOrders = orders.filter(o => isLastMonth(o.createdAt))

    const pendingCount = orders.filter(
      o => o.status === 'pendiente' || o.firestoreStatus === 'pending_confirmation',
    ).length

    const ventasHoy = todayOrders.filter(isSellableOrder).reduce((s, o) => s + o.total, 0)
    const ventasAyer = yesterdayOrders.filter(isSellableOrder).reduce((s, o) => s + o.total, 0)
    const ventasMes = monthOrders.filter(isSellableOrder).reduce((s, o) => s + o.total, 0)
    const ventasMesAnterior = lastMonthOrders.filter(isSellableOrder).reduce((s, o) => s + o.total, 0)

    // Build sparkline from last 8 days of daily totals
    const dailyMap: Record<string, number> = {}
    for (const order of orders) {
      if (!isSellableOrder(order)) continue
      const d = new Date(order.createdAt)
      if (Number.isNaN(d.getTime())) continue
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      dailyMap[key] = (dailyMap[key] || 0) + order.total
    }
    const today = new Date()
    const sparklinePoints = Array.from({ length: 8 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - (7 - i))
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      return dailyMap[key] || 0
    })

    return {
      recentOrders: recent,
      lowStockCount: lowStock.length,
      sparklinePoints,
      kpis: {
        ventasHoy,
        ventasAyer,
        ventasMes,
        ventasMesAnterior,
        growthHoy: growthLabel(ventasHoy, ventasAyer),
        growthMes: growthLabel(ventasMes, ventasMesAnterior),
        pendientes: pendingCount,
        pedidosHoy: todayOrders.length,
        stockOk: coverage,
        productosActivos: catalogProducts.length,
      },
    }
  }, [orders, products])

  const stockOk = lowStockCount === 0 && products.length > 0
  const avgRating = ratingSummary?.averageGeneral ?? null
  const ratingCount = ratingSummary?.reviewCount ?? null

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA]">

      {/* ── Hero ── */}
      <InternalHeaderBackground className="px-6 md:px-10 pt-6 pb-14 md:pt-8 md:rounded-b-3xl md:mt-4 md:mx-4">
        <div className="relative z-10 max-w-300 mx-auto w-full">
          <p className="text-[#C8FF00]/60 text-[10px] font-bold uppercase tracking-[0.18em] mb-1.5">
            Resumen de hoy
          </p>
          <h1 className="font-heading font-bold text-2xl md:text-4xl text-white leading-tight mb-3 tracking-tight">
            Hola, {companyName}
          </h1>

          {/* Status pills */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              {kpis.pendientes} pedido{kpis.pendientes !== 1 ? 's' : ''} pendiente{kpis.pendientes !== 1 ? 's' : ''}
            </span>
            <span className="text-white/30 text-xs">•</span>
            <span className="inline-flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
              <ShoppingCart className="h-3.5 w-3.5 text-blue-300" />
              {kpis.pedidosHoy} pedidos hoy
            </span>
            <span className="text-white/30 text-xs">•</span>
            <span className="inline-flex items-center gap-1.5 text-white text-xs font-medium px-3 py-1.5 rounded-full bg-white/10 border border-white/10">
              <CheckCircle className="h-3.5 w-3.5 text-[#C8FF00]" />
              {stockOk ? 'Stock OK' : `${lowStockCount} bajo stock`}
            </span>
          </div>

          {/* CTAs */}
          <div className="flex gap-2.5">
            <Link
              href="/distribuidora/pedidos"
              className="bg-lima text-primary hover:bg-lima/90 text-sm font-bold py-2.5 px-5 rounded-xl transition-colors inline-flex items-center gap-2"
            >
              <ShoppingCart className="h-4 w-4" /> Ver pedidos
            </Link>
            <Link
              href="/distribuidora/productos/nuevo"
              className="bg-white/10 hover:bg-white/20 text-white text-sm font-bold py-2.5 px-5 rounded-xl transition-colors inline-flex items-center gap-2 border border-white/15"
            >
              <Package className="h-4 w-4" /> Cargar producto
            </Link>
          </div>
        </div>
      </InternalHeaderBackground>

      {/* ── Main content ── */}
      <div className="px-6 md:px-10 -mt-6 relative z-10 max-w-300 mx-auto w-full pb-12">
        {isLoading ? (
          <DistribuidoraDashboardSkeleton />
        ) : (
          <>
            {/* ── KPI section ── */}
            <div className="mb-6 flex flex-col md:flex-row md:items-stretch gap-3">

              {/* Ventas de hoy — dominante en desktop */}
              <div className="md:w-[42%] md:shrink-0 bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05),0_4px_14px_rgba(11,26,69,0.07)] p-5 flex flex-col">
                <p className="text-[10px] font-bold text-[#7A839C] uppercase tracking-widest mb-1">Ventas de hoy</p>
                <h2 className="font-heading text-3xl md:text-5xl font-bold text-foreground mb-3">
                  {formatCurrency(kpis.ventasHoy)}
                </h2>
                <div className="flex-1 min-h-7">
                  <Sparkline points={sparklinePoints} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#7A839C]">vs. ayer</span>
                  {kpis.growthHoy ? (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 border ${kpis.growthHoy.up ? 'bg-[#F1FFD1] text-[#4A662E] border-[#89B317]/20' : 'bg-red-50 text-red-600 border-red-200/40'}`}>
                      {kpis.growthHoy.up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {kpis.growthHoy.up ? '+' : '-'}{kpis.growthHoy.pct}%
                    </span>
                  ) : null}
                </div>
              </div>

              {/* 2×2 mini KPI grid — mismo alto que ventas en desktop, sutil en mobile */}
              <div className="grid grid-cols-2 gap-2 md:flex-1">

                {/* Pedidos pendientes */}
                <Link href="/distribuidora/pedidos" className="bg-white rounded-xl md:rounded-2xl border border-[#DFE1E8]/70 md:shadow-[0_1px_3px_rgba(11,26,69,0.05),0_4px_14px_rgba(11,26,69,0.07)] p-3 md:p-4 flex flex-col justify-between hover:border-primary/20 hover:shadow-[0_2px_12px_rgba(11,26,69,0.09)] transition-all duration-150">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 md:h-7 md:w-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-500" />
                    </div>
                    <p className="text-[9px] md:text-[10px] font-bold text-[#7A839C] uppercase tracking-widest leading-tight">Pedidos pend.</p>
                  </div>
                  <p className="font-heading text-xl md:text-2xl font-bold text-foreground">{kpis.pendientes}</p>
                  {kpis.pendientes > 0 ? (
                    <p className="text-[9px] text-amber-600 font-semibold mt-1">Requieren atención</p>
                  ) : (
                    <p className="text-[9px] text-[#7A839C] mt-1">Sin pendientes</p>
                  )}
                </Link>

                {/* Ventas del mes */}
                <Link href="/distribuidora/ventas" className="bg-white rounded-xl md:rounded-2xl border border-[#DFE1E8]/70 md:shadow-[0_1px_3px_rgba(11,26,69,0.05),0_4px_14px_rgba(11,26,69,0.07)] p-3 md:p-4 flex flex-col justify-between hover:border-primary/20 hover:shadow-[0_2px_12px_rgba(11,26,69,0.09)] transition-all duration-150">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 md:h-7 md:w-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4 text-blue-500" />
                    </div>
                    <p className="text-[9px] md:text-[10px] font-bold text-[#7A839C] uppercase tracking-widest leading-tight">Ventas mes</p>
                  </div>
                  <p className="font-heading text-base md:text-xl font-bold text-foreground truncate">{formatCurrency(kpis.ventasMes)}</p>
                  {kpis.growthMes ? (
                    <span className={`text-[9px] font-semibold flex items-center gap-0.5 mt-1 ${kpis.growthMes.up ? 'text-[#4A662E]' : 'text-red-500'}`}>
                      {kpis.growthMes.up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                      {kpis.growthMes.up ? '+' : '-'}{kpis.growthMes.pct}% vs. anterior
                    </span>
                  ) : (
                    <span className="text-[9px] text-[#7A839C] mt-1">—</span>
                  )}
                </Link>

                {/* Productos activos */}
                <Link href="/distribuidora/productos" className="bg-white rounded-xl md:rounded-2xl border border-[#DFE1E8]/70 md:shadow-[0_1px_3px_rgba(11,26,69,0.05),0_4px_14px_rgba(11,26,69,0.07)] p-3 md:p-4 flex flex-col justify-between hover:border-primary/20 hover:shadow-[0_2px_12px_rgba(11,26,69,0.09)] transition-all duration-150">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 md:h-7 md:w-7 rounded-lg bg-[#F1FFD1] flex items-center justify-center shrink-0">
                      <Package className="h-3.5 w-3.5 md:h-4 md:w-4 text-[#4A662E]" />
                    </div>
                    <p className="text-[9px] md:text-[10px] font-bold text-[#7A839C] uppercase tracking-widest leading-tight">Productos activos</p>
                  </div>
                  <p className="font-heading text-xl md:text-2xl font-bold text-foreground">{kpis.productosActivos}</p>
                  <span className="text-[9px] text-[#4A662E] font-semibold flex items-center gap-0.5 mt-1">
                    <CheckCircle className="h-2.5 w-2.5" /> Actualizados
                  </span>
                </Link>

                {/* Rating promedio */}
                <Link href="/distribuidora/resenas" className="bg-white rounded-xl md:rounded-2xl border border-[#DFE1E8]/70 md:shadow-[0_1px_3px_rgba(11,26,69,0.05),0_4px_14px_rgba(11,26,69,0.07)] p-3 md:p-4 flex flex-col justify-between hover:border-primary/20 hover:shadow-[0_2px_12px_rgba(11,26,69,0.09)] transition-all duration-150">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-6 w-6 md:h-7 md:w-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                      <Star className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-400 fill-amber-400" />
                    </div>
                    <p className="text-[9px] md:text-[10px] font-bold text-[#7A839C] uppercase tracking-widest leading-tight">Rating prom.</p>
                  </div>
                  <p className="font-heading text-xl md:text-2xl font-bold text-foreground">
                    {avgRating !== null ? avgRating.toFixed(1) : '—'}
                  </p>
                  {avgRating !== null ? (
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`h-2.5 w-2.5 ${i <= Math.round(avgRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                      ))}
                      {ratingCount !== null && <span className="text-[9px] text-[#7A839C] ml-1">({ratingCount})</span>}
                    </div>
                  ) : (
                    <span className="text-[9px] text-[#7A839C] mt-1">—</span>
                  )}
                </Link>
              </div>
            </div>

            {/* ── Acciones rápidas ── */}
            {(() => {
              const actions = [
                { href: '/distribuidora/pedidos', icon: ClipboardList, label: 'Confirmar pedidos', desc: 'Revisá y confirmá los pedidos pendientes.', bg: 'bg-[#F1FFD1]', iconColor: 'text-[#4A662E]' },
                { href: '/distribuidora/productos/nuevo', icon: Package, label: 'Cargar producto', desc: 'Agregá nuevos productos al catálogo.', bg: 'bg-blue-50', iconColor: 'text-blue-600' },
                { href: '/distribuidora/productos', icon: Database, label: 'Actualizar stock', desc: 'Actualizá cantidades y disponibilidad.', bg: 'bg-violet-50', iconColor: 'text-violet-600' },
                { href: '/distribuidora/zonas', icon: MapPin, label: 'Zonas de entrega', desc: 'Gestioná tus zonas y tiempos.', bg: 'bg-orange-50', iconColor: 'text-orange-500' },
              ]
              return (
                <div className="mb-6">
                  <h2 className="font-heading font-bold text-base text-foreground mb-3">Acciones rápidas</h2>

                  {/* Mobile: fila de círculos en card blanca */}
                  <div className="md:hidden bg-white rounded-2xl border border-[#DFE1E8]/80 px-4 py-4 flex gap-2">
                    {actions.map(({ href, icon: Icon, label, bg, iconColor }) => (
                      <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-2">
                        <div className={`h-11 w-11 rounded-full ${bg} flex items-center justify-center active:scale-95 transition-transform`}>
                          <Icon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                        <span className="text-[10px] font-semibold text-[#5F6880] text-center leading-tight">{label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Desktop: cards con descripción */}
                  <div className="hidden md:grid md:grid-cols-4 gap-3">
                    {actions.map(({ href, icon: Icon, label, desc, bg, iconColor }) => (
                      <Link key={href} href={href}>
                        <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 p-4 flex flex-col gap-3 hover:border-primary/20 hover:shadow-[0_2px_14px_rgba(11,26,69,0.09)] transition-all duration-200 group cursor-pointer h-full">
                          <div className={`h-9 w-9 rounded-xl ${bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                            <Icon className={`h-5 w-5 ${iconColor}`} />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-foreground">{label}</p>
                            <p className="text-xs text-[#7A839C] mt-0.5 leading-relaxed">{desc}</p>
                          </div>
                          <div className="flex justify-end">
                            <div className="h-6 w-6 rounded-full bg-[#F7F8FA] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <ChevronRight className="h-3.5 w-3.5 text-[#7A839C] group-hover:text-primary transition-colors" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── Bottom row ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Últimos pedidos */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05),0_4px_14px_rgba(11,26,69,0.07)] p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-bold text-base text-foreground">Últimos pedidos</h2>
                  <Link href="/distribuidora/pedidos" className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5">
                    Ver todos <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {recentOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#DFE1E8] bg-[#F7F8FA] px-6 py-10 text-center">
                    <p className="font-bold text-[#0B1A45]">Todavía no hay pedidos recientes</p>
                    <p className="mt-2 text-sm text-[#7A839C]">Cuando entren pedidos nuevos, los vas a ver primero acá.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {recentOrders.map((order: any) => (
                      <div
                        key={order.id}
                        className="py-3 px-3 rounded-xl hover:bg-[#F7F8FA] transition-colors group"
                      >
                        {/* Fila superior: ícono + info + monto */}
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-[#F1F3F8] flex items-center justify-center shrink-0">
                            <ShoppingCart className="h-4.5 w-4.5 text-[#5F6880]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                              {order.comercioName}
                            </p>
                            <p className="text-xs text-[#7A839C]">
                              {order.orderNumber || `#${order.id}`} · {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                            </p>
                          </div>
                          <p className="font-heading font-bold text-sm text-foreground shrink-0">
                            {formatCurrency(order.total)}
                          </p>
                        </div>
                        {/* Fila inferior: badge + botón */}
                        <div className="flex items-center justify-between mt-2 pl-12">
                          <StatusBadge status={order.firestoreStatus ?? order.status} />
                          <Link
                            href={`/distribuidora/pedidos/${order.id}`}
                            className="shrink-0 text-xs font-semibold text-primary bg-primary/8 hover:bg-primary hover:text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                          >
                            Ver pedido
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inventario al día */}
              <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05),0_4px_14px_rgba(11,26,69,0.07)] p-5 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-bold text-base text-foreground">Inventario al día</h2>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${stockOk ? 'bg-[#F1FFD1] text-[#4A662E]' : 'bg-amber-50 text-amber-700'}`}>
                    {stockOk ? 'Todo OK' : `${lowStockCount} alertas`}
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-4 text-center gap-2">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stockOk ? 'bg-[#F1FFD1]' : 'bg-amber-50'}`}>
                    {stockOk
                      ? <CheckCircle className="h-7 w-7 text-[#4A662E]" />
                      : <AlertCircle className="h-7 w-7 text-amber-500" />}
                  </div>
                  <p className="font-bold text-sm text-foreground">
                    {stockOk ? '¡Todo en orden!' : `${lowStockCount} productos con stock bajo`}
                  </p>
                  <p className="text-xs text-[#7A839C] leading-relaxed px-2">
                    {stockOk
                      ? 'No hay productos por debajo del stock recomendado.'
                      : 'Revisá y reponés antes de quedarte sin stock.'}
                  </p>
                </div>

                <div className="border-t border-[#DFE1E8]/60 pt-4 mt-2">
                  <p className="text-[10px] font-bold text-[#7A839C] uppercase tracking-widest mb-3">Resumen de stock</p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-heading font-bold text-lg text-foreground">{kpis.productosActivos}</p>
                      <p className="text-[10px] text-[#7A839C] leading-tight">Productos activos</p>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-lg text-foreground">{lowStockCount}</p>
                      <p className="text-[10px] text-[#7A839C] leading-tight">Bajo stock</p>
                    </div>
                    <div>
                      <p className="font-heading font-bold text-lg text-foreground">
                        {kpis.stockOk !== null ? `${kpis.stockOk}%` : '—'}
                      </p>
                      <p className="text-[10px] text-[#7A839C] leading-tight">Disponibilidad</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/distribuidora/productos"
                  className="mt-4 text-xs font-semibold text-primary flex items-center justify-center gap-1 hover:underline"
                >
                  Ver catálogo completo <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
