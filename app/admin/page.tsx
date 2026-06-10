'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, Truck, Store, ClipboardList, Receipt, AlertTriangle, ChevronRight, PauseCircle, XCircle, FlaskConical } from 'lucide-react'
import { getAdminDashboardStats } from '@/lib/data/admin.service'
import { formatCurrency } from '@/lib/utils'
import { AdminDashboardSkeleton } from '@/components/ui/SkeletonCard'

type Stats = Awaited<ReturnType<typeof getAdminDashboardStats>>

function StatCard({ label, value, sub, icon: Icon, iconBg, href }: {
  label: string; value: string | number; sub?: string; icon: React.ElementType; iconBg: string; href: string
}) {
  return (
    <Link href={href} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-gray-900 font-heading">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Link>
  )
}

const monthLabel = new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    getAdminDashboardStats().then(setStats)
  }, [])

  if (!stats) return <AdminDashboardSkeleton />

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading font-bold text-2xl md:text-3xl text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1 capitalize">Resumen general de la plataforma · {monthLabel}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Distribuidoras activas" value={stats.activeDistributors} icon={Truck} iconBg="bg-green-50 text-green-600" href="/admin/distribuidoras" />
        <StatCard label="Comercios activos" value={stats.activeCommerces} icon={Store} iconBg="bg-blue-50 text-blue-600" href="/admin/comercios" />
        <StatCard label="Pedidos del mes" value={stats.monthOrders} icon={ClipboardList} iconBg="bg-purple-50 text-purple-600" href="/admin/pedidos" />
        <StatCard label="Comisiones pendientes" value={formatCurrency(stats.pendingCommissions)} sub="1.5% sobre ventas" icon={Receipt} iconBg="bg-amber-50 text-amber-600" href="/admin/comisiones" />
        <StatCard label="Ventas generadas" value={formatCurrency(stats.totalRevenue)} sub="pedidos entregados" icon={TrendingUp} iconBg="bg-[#F1FFD1] text-[#4A662E]" href="/admin/pedidos" />
      </div>

      {/* Internal test activity — secondary, de-emphasized */}
      {(stats.test.monthOrders > 0 || stats.test.totalRevenue > 0 || stats.test.pendingCommissions > 0) && (
        <div className="mb-6 px-4 py-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <FlaskConical className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Actividad interna de prueba</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400">
            <span><span className="font-semibold text-gray-500">{stats.test.monthOrders}</span> pedidos test este mes</span>
            {stats.test.totalRevenue > 0 && <span><span className="font-semibold text-gray-500">{formatCurrency(stats.test.totalRevenue)}</span> en ventas test</span>}
            {stats.test.pendingCommissions > 0 && <span><span className="font-semibold text-gray-500">{formatCurrency(stats.test.pendingCommissions)}</span> com. test pendiente</span>}
          </div>
        </div>
      )}

      {/* Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overdue commissions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Comisiones vencidas</h2>
          </div>
          {stats.overdueDistributors.length === 0 ? (
            <p className="text-sm text-gray-400">Sin alertas</p>
          ) : (
            <ul className="space-y-2">
              {stats.overdueDistributors.map(name => (
                <li key={name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{name}</span>
                  <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full font-semibold">Vencida</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/comisiones" className="mt-4 block text-xs text-primary font-semibold hover:underline">
            Ver comisiones →
          </Link>
        </div>

        {/* Cancelled orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="h-4 w-4 text-orange-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Pedidos cancelados / no entregados</h2>
          </div>
          <p className="text-3xl font-bold font-heading text-gray-900">{stats.cancelledOrders}</p>
          <p className="text-sm text-gray-400 mt-1">este mes</p>
          <Link href="/admin/pedidos?status=cancelled" className="mt-4 block text-xs text-primary font-semibold hover:underline">
            Ver pedidos →
          </Link>
        </div>

        {/* Paused distributors */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <PauseCircle className="h-4 w-4 text-gray-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Distribuidoras pausadas</h2>
          </div>
          {stats.pausedDistributors.length === 0 ? (
            <p className="text-sm text-gray-400">Ninguna</p>
          ) : (
            <ul className="space-y-2">
              {stats.pausedDistributors.map(d => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{d.companyName}</span>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-semibold">Pausada</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/admin/distribuidoras" className="mt-4 block text-xs text-primary font-semibold hover:underline">
            Ver distribuidoras →
          </Link>
        </div>
      </div>
    </div>
  )
}
