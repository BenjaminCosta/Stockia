'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Pause, AlertTriangle } from 'lucide-react'
import { getAdminCommissions, adminMarkCommissionPaid, type AdminCommission } from '@/lib/data/admin.service'
import { formatCurrency } from '@/lib/mock-data'

const statusConfig = {
  pending: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700' },
  paid:    { label: 'Pagada',    className: 'bg-green-50 text-green-700' },
  overdue: { label: 'Vencida',   className: 'bg-red-50 text-red-700' },
}

// Group commissions by distributor for summary cards
function groupByDistributor(commissions: AdminCommission[]) {
  const map: Record<string, { name: string; pending: number; overdue: number; paid: number; total: number }> = {}
  commissions.forEach(c => {
    if (!map[c.distributorId]) map[c.distributorId] = { name: c.distributorName, pending: 0, overdue: 0, paid: 0, total: 0 }
    map[c.distributorId][c.status] += c.commissionAmount
    map[c.distributorId].total += c.commissionAmount
  })
  return Object.values(map)
}

export default function AdminComisionesPage() {
  const [commissions, setCommissions] = useState<AdminCommission[]>([])
  const [filter, setFilter] = useState<AdminCommission['status'] | 'all'>('all')

  useEffect(() => { getAdminCommissions().then(setCommissions) }, [])

  const summary = groupByDistributor(commissions)
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0)
  const totalOverdue = commissions.filter(c => c.status === 'overdue').reduce((s, c) => s + c.commissionAmount, 0)

  const filtered = filter === 'all' ? commissions : commissions.filter(c => c.status === filter)

  const markAsPaid = async (id: string) => {
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'paid' as const } : c))
    try {
      await adminMarkCommissionPaid(id)
    } catch (err) {
      console.error('Error marking commission as paid:', err)
      setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'pending' as const } : c))
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Comisiones</h1>
        <p className="text-gray-500 text-sm mt-1">1.5% sobre pedidos entregados</p>
      </div>

      {/* Summary cards per distributor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {summary.map(d => (
          <div key={d.name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="font-semibold text-gray-900 mb-3">{d.name}</p>
            <div className="space-y-1.5 text-sm">
              {d.pending > 0 && (
                <div className="flex justify-between">
                  <span className="text-amber-600 font-medium">Pendiente</span>
                  <span className="font-semibold">{formatCurrency(d.pending)}</span>
                </div>
              )}
              {d.overdue > 0 && (
                <div className="flex justify-between">
                  <span className="text-red-600 font-medium flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Vencida</span>
                  <span className="font-semibold">{formatCurrency(d.overdue)}</span>
                </div>
              )}
              {d.paid > 0 && (
                <div className="flex justify-between text-gray-400">
                  <span>Pagada</span>
                  <span>{formatCurrency(d.paid)}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Totals card */}
        <div className="bg-primary rounded-2xl p-5 text-white">
          <p className="text-sm font-semibold text-white/70 mb-3">Totales Stockia</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">Por cobrar</span>
              <span className="font-bold">{formatCurrency(totalPending)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Vencidas</span>
              <span className="font-bold text-red-300">{formatCurrency(totalOverdue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4">
        {(['all', 'pending', 'overdue', 'paid'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${filter === s ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            {s === 'all' ? 'Todas' : statusConfig[s].label}
          </button>
        ))}
      </div>

      {/* Commission rows */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Distribuidora</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Pedido</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Período</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Venta</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Comisión</th>
              <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4 font-medium text-gray-900">{c.distributorName}</td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="font-mono text-xs text-gray-500">{c.orderNumber}</span>
                </td>
                <td className="px-4 py-4 text-gray-500 text-xs hidden lg:table-cell">{c.period}</td>
                <td className="px-4 py-4 text-gray-600 hidden lg:table-cell">{formatCurrency(c.orderTotal)}</td>
                <td className="px-4 py-4 font-bold text-gray-900">{formatCurrency(c.commissionAmount)}</td>
                <td className="px-4 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusConfig[c.status].className}`}>
                    {statusConfig[c.status].label}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex gap-1 justify-end">
                    {c.status !== 'paid' && (
                      <button
                        onClick={() => markAsPaid(c.id)}
                        title="Marcar como pagada"
                        className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-green-700 hover:bg-green-50 transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Pagada
                      </button>
                    )}
                    <button
                      title="Pausar catálogo"
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                    >
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">Sin comisiones</div>
        )}
      </div>
    </div>
  )
}
