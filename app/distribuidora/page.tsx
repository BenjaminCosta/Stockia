'use client'

import Link from 'next/link'
import { TrendingUp, Package, Clock, CheckCircle, AlertCircle, ShoppingCart, ChevronRight } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { PageHero } from '@/components/ui/PageHero'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useDistribuidoraOrders, useProducts } from '@/hooks/use-data'
import { Distribuidora } from '@/lib/types'
import { DistribuidoraDashboardSkeleton } from '@/components/ui/SkeletonCard'

export default function DistribuidoraDashboardPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const companyName = distribuidora?.companyName || 'Mi distribuidora'

  const distId = distribuidora?.id || 'dist-1'
  const { data: orders, loading: ordersLoading } = useDistribuidoraOrders(distId)
  const { data: products, loading: productsLoading } = useProducts(distId)
  const isLoading = ordersLoading || productsLoading
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4)
  const lowStockProducts = products.filter(p => p.stock <= 10)
  const lowStockCount = lowStockProducts.length
  const healthyStockCount = products.filter(p => p.stock > 10).length
  const stockCoverage = products.length > 0 ? Math.round((healthyStockCount / products.length) * 100) : null
  const pendingCount = orders.filter(o => o.status === 'pendiente' || o.firestoreStatus === 'pending_confirmation').length
  const kpis = {
    ventasHoy: orders.reduce((s, o) => s + o.total, 0),
    pendientes: pendingCount,
    pedidosHoy: orders.length,
    stockOk: stockCoverage,
  }

  const stockMessage = products.length === 0
    ? {
        title: 'Catalogo vacio',
        description: 'Cargá tu primer producto para empezar a operar.',
        tone: 'bg-[#F7F8FA] border-[#DFE1E8]/70',
        textTone: 'text-[#5F6880]',
        iconTone: 'text-[#0B1A45]',
      }
    : lowStockCount > 0
      ? {
          title: `Stock bajo (${lowStockCount} ${lowStockCount === 1 ? 'producto' : 'productos'})`,
          description: lowStockCount === 1
            ? `${lowStockProducts[0].name} está por agotarse.`
            : `${lowStockProducts[0].name} y ${lowStockCount - 1} ${lowStockCount - 1 === 1 ? 'producto más' : 'productos más'} necesitan reposición.`,
          tone: 'bg-amber-50 border-amber-200/70',
          textTone: 'text-amber-800',
          iconTone: 'text-amber-600',
        }
      : {
          title: 'Inventario al día',
          description: 'No hay productos por debajo del stock recomendado.',
          tone: 'bg-[#F4FBE7] border-[#D9EEA8]',
          textTone: 'text-[#4A662E]',
          iconTone: 'text-[#4A662E]',
        }

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
        {isLoading ? (
          <DistribuidoraDashboardSkeleton />
        ) : (
          <>
        <div
          className="bg-white rounded-2xl md:rounded-3xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05),0_6px_20px_rgba(11,26,69,0.07)] p-4 md:p-6 mb-4 md:mb-6 animate-fade-up"
          style={{ animationDelay: '0ms' }}
        >
          <div className="flex justify-between items-start mb-4 md:mb-6">
            <div>
              <p className="text-[10px] md:text-xs font-bold text-[#7A839C] uppercase tracking-widest mb-1">Ventas de hoy</p>
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground">{formatCurrency(kpis.ventasHoy)}</h2>
            </div>
            <div className="bg-[#F1FFD1] text-[#4A662E] px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-fade-in border border-[#89B317]/20" style={{ animationDelay: '200ms' }}>
              <TrendingUp className="h-3 w-3" /> +12%
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4 pt-4 md:pt-6 border-t border-[#DFE1E8]/60">
            {[
              { icon: Clock, label: 'Pendientes', value: String(kpis.pendientes), color: '' },
              { icon: Package, label: 'Pedidos hoy', value: String(kpis.pedidosHoy), color: '' },
              { icon: CheckCircle, label: 'Stock OK', value: kpis.stockOk === null ? '—' : `${kpis.stockOk}%`, color: 'text-[#89B317]' },
            ].map(({ icon: Icon, label, value, color }, i) => (
              <div
                key={label}
                className="animate-fade-up"
                style={{ animationDelay: `${100 + i * 80}ms` }}
              >
                <p className="text-[10px] md:text-xs text-[#7A839C] mb-0.5 font-medium flex items-center gap-1">
                  <Icon className="h-3 w-3" /> {label}
                </p>
                <p className={`font-bold text-lg md:text-xl ${color || 'text-foreground'}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
          <div
            className={`${stockMessage.tone} rounded-xl md:rounded-2xl border p-4 flex gap-3 items-start animate-fade-up shadow-[0_1px_3px_rgba(11,26,69,0.05)]`}
            style={{ animationDelay: '140ms' }}
          >
            <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${stockMessage.iconTone}`} />
            <div>
              <h3 className="font-bold text-sm text-foreground">{stockMessage.title}</h3>
              <p className={`text-xs md:text-sm mt-0.5 md:mt-1 ${stockMessage.textTone}`}>
                {stockMessage.description}
              </p>
            </div>
          </div>
          <Link href="/distribuidora/productos">
            <div
              className="bg-white border border-[#DFE1E8] rounded-xl md:rounded-2xl p-4 flex gap-3 items-center justify-between cursor-pointer hover:border-primary/20 hover:shadow-[0_2px_8px_rgba(11,26,69,0.07)] transition-[border-color,box-shadow] duration-200 group h-full animate-fade-up"
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
        <section className="rounded-4xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_10px_30px_rgba(11,26,69,0.07)] md:p-6">
          <div className="mb-4 flex items-center justify-between md:mb-6">
            <h2 className="font-heading font-bold text-base md:text-xl text-foreground">Últimos pedidos</h2>
            <Link href="/distribuidora/pedidos" className="text-xs md:text-sm font-medium text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {recentOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#DFE1E8] bg-[#F7F8FA] px-6 py-10 text-center">
                <p className="font-bold text-[#0B1A45]">Todavía no hay pedidos recientes</p>
                <p className="mt-2 text-sm text-[#7A839C]">Cuando entren pedidos nuevos, los vas a ver primero acá.</p>
              </div>
            ) : (
              recentOrders.map((order: any, i: number) => (
                <Link key={order.id} href={`/distribuidora/pedidos/${order.id}`}>
                  <div
                    className="group animate-fade-up rounded-2xl border border-[#DFE1E8] bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#0B1A45]/15 hover:shadow-[0_8px_20px_rgba(11,26,69,0.08)]"
                    style={{ animationDelay: `${260 + i * 60}ms` }}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 flex items-center gap-2">
                          <span className="truncate font-bold text-foreground transition-colors group-hover:text-primary md:text-lg">
                            {order.comercioName}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {order.orderNumber || `#${order.id}`} · {order.items.length} {order.items.length === 1 ? 'producto' : 'productos'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3 md:w-auto md:flex-col md:items-end md:border-none md:pt-0">
                        <div className="text-right md:min-w-30">
                          <p className="font-heading text-lg font-bold text-foreground md:text-xl">{formatCurrency(order.total)}</p>
                        </div>
                        <StatusBadge status={order.firestoreStatus ?? order.status} />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
          </>
        )}
      </div>
    </div>
  )
}
