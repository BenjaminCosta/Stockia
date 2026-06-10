'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Pause, Play, ChevronRight, FlaskConical } from 'lucide-react'
import { getAdminDistributors, adminSetDistributorStatus, type AdminDistributor } from '@/lib/data/admin.service'
import { formatCurrency } from '@/lib/utils'
import { AdminListSkeleton } from '@/components/ui/SkeletonCard'

const statusConfig = {
  active:  { label: 'Activa',      className: 'bg-green-50 text-green-700' },
  paused:  { label: 'Pausada',     className: 'bg-gray-100 text-gray-600' },
  review:  { label: 'En revisión', className: 'bg-amber-50 text-amber-700' },
}

export default function AdminDistribuidorasPage() {
  const router = useRouter()
  const [distributors, setDistributors] = useState<AdminDistributor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminDistributor['status'] | 'all'>('all')
  const [testFilter, setTestFilter] = useState<'all' | 'real' | 'test'>('all')

  useEffect(() => { getAdminDistributors().then(data => { setDistributors(data); setLoading(false) }) }, [])

  const filtered = distributors.filter(d => {
    const matchSearch = d.companyName.toLowerCase().includes(search.toLowerCase()) || d.city.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    const matchTest = testFilter === 'all' || (testFilter === 'test' ? !!d.isInternalTest : !d.isInternalTest)
    return matchSearch && matchStatus && matchTest
  })

  const toggleStatus = async (id: string, currentStatus: AdminDistributor['status']) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active'
    setDistributors(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d))
    try {
      await adminSetDistributorStatus(id, newStatus)
    } catch (err) {
      console.error('Error updating distributor status:', err)
      setDistributors(prev => prev.map(d => d.id === id ? { ...d, status: currentStatus } : d))
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <div className="h-7 w-36 bg-[#EEF1F5] rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-28 bg-[#EEF1F5] rounded animate-pulse" />
        </div>
        <AdminListSkeleton rows={5} label="Cargando distribuidoras" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Distribuidoras</h1>
        <p className="text-gray-500 text-sm mt-1">{filtered.length} de {distributors.length} registradas</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o ciudad..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 [-webkit-overflow-scrolling:touch]">
          {(['all', 'active', 'paused', 'review'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {s === 'all' ? 'Todas' : statusConfig[s].label}
            </button>
          ))}
          <div className="w-px bg-gray-200 mx-1 self-stretch" />
          {([
            { value: 'all',  label: 'Reales + Prueba' },
            { value: 'real', label: 'Solo reales' },
            { value: 'test', label: 'Prueba', icon: FlaskConical },
          ] as const).map(f => (
            <button
              key={f.value}
              onClick={() => setTestFilter(f.value)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${testFilter === f.value ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {'icon' in f && <f.icon className="h-3 w-3" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Sin resultados</div>
        )}
        {filtered.map(d => (
          <div
            key={d.id}
            onClick={() => router.push(`/admin/distribuidoras/${d.id}`)}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 cursor-pointer hover:border-gray-200 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{d.companyName}</p>
                  {d.isInternalTest && (
                    <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                      <FlaskConical className="h-2.5 w-2.5" /> Prueba
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{d.email}</p>
                <p className="text-xs text-gray-500 mt-1">{d.city}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${statusConfig[d.status].className}`}>
                {statusConfig[d.status].label}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <div className="flex gap-4 text-xs">
                <div>
                  <p className="text-gray-400">Pedidos</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{d.totalOrders}</p>
                </div>
                <div>
                  <p className="text-gray-400">Com. pendiente</p>
                  <p className={`font-semibold mt-0.5 ${d.pendingCommission > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                    {d.pendingCommission > 0 ? formatCurrency(d.pendingCommission) : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); toggleStatus(d.id, d.status) }}
                title={d.status === 'active' ? 'Pausar catálogo' : 'Reactivar catálogo'}
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-colors ${d.status === 'active' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}
              >
                {d.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
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
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Ciudad</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pedidos</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Ventas totales</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Com. pendiente</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(d => (
                <tr
                  key={d.id}
                  onClick={() => router.push(`/admin/distribuidoras/${d.id}`)}
                  className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{d.companyName}</p>
                        {d.isInternalTest && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded-full">
                            <FlaskConical className="h-2.5 w-2.5" /> Prueba
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{d.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 hidden lg:table-cell">{d.city}</td>
                  <td className="px-4 py-4 font-medium text-gray-700">{d.totalOrders}</td>
                  <td className="px-4 py-4 font-medium text-gray-700 hidden lg:table-cell">{formatCurrency(d.totalRevenue)}</td>
                  <td className="px-4 py-4">
                    <span className={`font-semibold ${d.pendingCommission > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                      {d.pendingCommission > 0 ? formatCurrency(d.pendingCommission) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[d.status].className}`}>
                      {statusConfig[d.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={e => { e.stopPropagation(); toggleStatus(d.id, d.status) }}
                        title={d.status === 'active' ? 'Pausar catálogo' : 'Reactivar catálogo'}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${d.status === 'active' ? 'text-gray-400 hover:bg-amber-50 hover:text-amber-600' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                      >
                        {d.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <ChevronRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Sin resultados</div>
          )}
        </div>
      </div>
    </div>
  )
}
