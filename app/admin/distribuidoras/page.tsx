'use client'

import { useEffect, useState } from 'react'
import { Search, Pause, Play, ChevronRight } from 'lucide-react'
import { getAdminDistributors, adminSetDistributorStatus, type AdminDistributor } from '@/lib/data/admin.service'
import { formatCurrency } from '@/lib/mock-data'

const statusConfig = {
  active:  { label: 'Activa',      className: 'bg-green-50 text-green-700' },
  paused:  { label: 'Pausada',     className: 'bg-gray-100 text-gray-600' },
  review:  { label: 'En revisión', className: 'bg-amber-50 text-amber-700' },
}

export default function AdminDistribuidorasPage() {
  const [distributors, setDistributors] = useState<AdminDistributor[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminDistributor['status'] | 'all'>('all')

  useEffect(() => { getAdminDistributors().then(setDistributors) }, [])

  const filtered = distributors.filter(d => {
    const matchSearch = d.companyName.toLowerCase().includes(search.toLowerCase()) || d.city.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || d.status === statusFilter
    return matchSearch && matchStatus
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

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Distribuidoras</h1>
        <p className="text-gray-500 text-sm mt-1">{distributors.length} registradas</p>
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
        <div className="flex gap-2">
          {(['all', 'active', 'paused', 'review'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {s === 'all' ? 'Todas' : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Empresa</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Ciudad</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Pedidos</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Ventas totales</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Com. pendiente</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(d => (
                <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{d.companyName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{d.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 hidden lg:table-cell">{d.city}</td>
                  <td className="px-4 py-4 font-medium text-gray-700 hidden md:table-cell">{d.totalOrders}</td>
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
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => toggleStatus(d.id, d.status)}
                        title={d.status === 'active' ? 'Pausar catálogo' : 'Reactivar catálogo'}
                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${d.status === 'active' ? 'text-gray-400 hover:bg-amber-50 hover:text-amber-600' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                      >
                        {d.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                        <ChevronRight className="h-4 w-4" />
                      </button>
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
