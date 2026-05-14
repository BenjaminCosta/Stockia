'use client'

import Link from 'next/link'
import { TrendingUp, Package, Clock, CheckCircle, AlertCircle, ShoppingCart, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { PageHero } from '@/components/ui/PageHero'
import { useApp } from '@/lib/app-context'
import { mockDashboardKPIs, mockOrders, formatCurrency, getLowStockProducts } from '@/lib/mock-data'
import { Distribuidora } from '@/lib/types'

export default function DistribuidoraDashboardPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const companyName = distribuidora?.companyName || 'Mi distribuidora'

  const distId = distribuidora?.id || 'dist-1'
  const recentOrders = mockOrders.filter(o => o.distribuidoraId === distId).slice(0, 4)
  const lowStockProducts = getLowStockProducts(distId)
  const kpis = mockDashboardKPIs

  return (
    <div className="flex flex-col min-h-screen">
      <PageHero
        label="Resumen de hoy"
        title={`Hola, ${companyName}`}
        className="pb-20 md:rounded-b-3xl md:mt-4 md:mx-4"
      >
        <div className="flex gap-2">
          <Link
            href="/distribuidora/pedidos"
            className="bg-lima text-primary hover:bg-lima/90 text-xs md:text-sm font-bold py-2 px-3 md:py-2.5 md:px-4 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" /> Ver pedidos
          </Link>
          <Link
            href="/distribuidora/productos/nuevo"
            className="bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-bold py-2 px-3 md:py-2.5 md:px-4 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Package className="h-3.5 w-3.5 md:h-4 md:w-4" /> Cargar producto
          </Link>
        </div>
      </PageHero>

      {/* Main content — floats over hero */}
      <div className="px-4 md:px-8 -mt-8 md:-mt-12 relative z-10 max-w-4xl mx-auto w-full pb-8 md:pb-12">
        {/* Main KPI card */}
        <div
          className="bg-white rounded-2xl md:rounded-3xl shadow-lg border border-gray-100 p-4 md:p-6 mb-4 md:mb-6 animate-fade-up"
          style={{ animationDelay: '0ms' }}
        >
          <div className="flex justify-between items-start mb-4 md:mb-6">
            <div>
              <p className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-0.5">Ventas de hoy</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">{formatCurrency(kpis.ventasHoy)}</h2>
            </div>
            <div className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <TrendingUp className="h-3 w-3" /> +12%
            </div>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-100">
            {[
              { icon: Clock, label: 'Pendientes', value: String(kpis.pendientes), color: '' },
              { icon: Package, label: 'Pedidos hoy', value: String(kpis.pedidosHoy), color: '' },
              { icon: CheckCircle, label: 'Stock OK', value: `${kpis.stockOk}%`, color: 'text-green-600' },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <div
                key={label}
                className="animate-fade-up"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <p className="text-[10px] md:text-xs text-gray-500 mb-0.5 font-medium flex items-center gap-1">
                  <Icon className="h-3 w-3" /> {label}
                </p>
                <p className={`font-bold text-lg md:text-xl ${color || 'text-foreground'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Alert + Action cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          <div
            className="bg-amber-50 border border-amber-200 rounded-xl md:rounded-2xl p-4 flex gap-3 items-start animate-fade-up"
            style={{ animationDelay: '140ms' }}
          >
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-sm">
                Stock bajo ({lowStockProducts.length} {lowStockProducts.length === 1 ? 'producto' : 'productos'})
              </h3>
              <p className="text-xs md:text-sm text-amber-800 mt-0.5 md:mt-1">
                {lowStockProducts.length > 0
                  ? `${lowStockProducts[0].name} está por agotarse.`
                  : 'Revisá el inventario para más detalles.'}
              </p>
            </div>
          </div>
          <Link href="/distribuidora/productos">
            <div
              className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 flex gap-3 items-center justify-between cursor-pointer hover:border-primary/30 hover:shadow-sm transition-all group h-full animate-fade-up"
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 md:h-12 md:w-12 bg-lima-soft text-green-dark rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                  <Package className="h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm md:text-base">Catálogo</h3>
                  <p className="text-xs text-gray-500">Gestionar productos</p>
                </div>
              </div>
              <span className="text-primary text-xs md:text-sm font-bold bg-primary/10 px-3 py-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                Abrir
              </span>
            </div>
          </Link>
        </div>

        {/* Recent orders */}
        <div>
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <h2 className="font-heading font-bold text-base md:text-xl text-foreground">Últimos pedidos</h2>
            <Link href="/distribuidora/pedidos" className="text-xs md:text-sm font-medium text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">No hay pedidos recientes</p>
            ) : (
              recentOrders.map((order, i) => (
                <Link key={order.id} href={`/distribuidora/pedidos/${order.id}`}>
                  <div
                    className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group animate-fade-up"
                    style={{ animationDelay: `${260 + i * 60}ms` }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-foreground text-sm md:text-lg group-hover:text-primary transition-colors">
                          {order.comercioName}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                          {order.zone}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">#{order.id} · {order.items.length} productos</p>
                    </div>
                    <div className="flex justify-between items-center md:flex-col md:items-end w-full md:w-auto border-t border-gray-100 pt-3 md:border-none md:pt-0">
                      <p className="font-heading font-bold text-lg md:text-xl text-foreground">{formatCurrency(order.total)}</p>
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
