'use client'

import { useEffect, useState } from 'react'
import { Search, ShieldOff, ShieldCheck } from 'lucide-react'
import { getAdminCommerces, adminSetCommerceStatus, type AdminCommerce } from '@/lib/data/admin.service'
import { formatCurrency } from '@/lib/utils'
import { AdminListSkeleton } from '@/components/ui/SkeletonCard'

const statusConfig = {
  active:  { label: 'Activo',       className: 'bg-green-50 text-green-700' },
  review:  { label: 'En revisión',  className: 'bg-amber-50 text-amber-700' },
  blocked: { label: 'Bloqueado',    className: 'bg-red-50 text-red-700' },
}

export default function AdminComerciosPage() {
  const [commerces, setCommerces] = useState<AdminCommerce[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdminCommerce['status'] | 'all'>('all')

  useEffect(() => { getAdminCommerces().then(data => { setCommerces(data); setLoading(false) }) }, [])

  const filtered = commerces.filter(c => {
    const matchSearch = c.businessName.toLowerCase().includes(search.toLowerCase()) || c.city.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const toggleBlock = async (id: string, currentStatus: AdminCommerce['status']) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked'
    setCommerces(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
    try {
      await adminSetCommerceStatus(id, newStatus)
    } catch (err) {
      console.error('Error updating commerce status:', err)
      setCommerces(prev => prev.map(c => c.id === id ? { ...c, status: currentStatus } : c))
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full">
        <div className="mb-6">
          <div className="h-7 w-28 bg-[#EEF1F5] rounded-xl animate-pulse mb-2" />
          <div className="h-4 w-24 bg-[#EEF1F5] rounded animate-pulse" />
        </div>
        <AdminListSkeleton rows={5} label="Cargando comercios" />
      </div>
    )
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Comercios</h1>
        <p className="text-gray-500 text-sm mt-1">{commerces.length} registrados</p>
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
          {(['all', 'active', 'review', 'blocked'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`shrink-0 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              {s === 'all' ? 'Todos' : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Sin resultados</div>
        )}
        {filtered.map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{c.businessName}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{c.email}</p>
                <p className="text-xs text-gray-500 mt-1">{c.city}</p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold shrink-0 ${statusConfig[c.status].className}`}>
                {statusConfig[c.status].label}
              </span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <div className="flex gap-4 text-xs">
                <div>
                  <p className="text-gray-400">Pedidos</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{c.totalOrders}</p>
                </div>
                <div>
                  <p className="text-gray-400">Total comprado</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{formatCurrency(c.totalSpent)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Miembro desde</p>
                  <p className="font-semibold text-gray-700 mt-0.5">
                    {c.joinedAt ? new Date(c.joinedAt + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleBlock(c.id, c.status)}
                title={c.status === 'blocked' ? 'Desbloquear' : 'Bloquear cuenta'}
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${c.status === 'blocked' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}
              >
                {c.status === 'blocked' ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
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
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Comercio</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Ciudad</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Pedidos</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Total comprado</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Desde</th>
                <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-semibold text-gray-900">{c.businessName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-600 hidden lg:table-cell">{c.city}</td>
                  <td className="px-4 py-4 font-medium text-gray-700">{c.totalOrders}</td>
                  <td className="px-4 py-4 font-medium text-gray-700 hidden lg:table-cell">{formatCurrency(c.totalSpent)}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs hidden lg:table-cell">
                    {c.joinedAt ? new Date(c.joinedAt + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[c.status].className}`}>
                      {statusConfig[c.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => toggleBlock(c.id, c.status)}
                      title={c.status === 'blocked' ? 'Desbloquear' : 'Bloquear cuenta'}
                      className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${c.status === 'blocked' ? 'text-gray-400 hover:bg-green-50 hover:text-green-600' : 'text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                    >
                      {c.status === 'blocked' ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                    </button>
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
