'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Ban, AlertTriangle, Lock, Unlock, ChevronDown } from 'lucide-react'
import {
  getAdminCommissions,
  adminMarkCommissionPaid,
  adminWaiveCommission,
  adminSetDistributorCommissionStatus,
  type AdminCommission,
} from '@/lib/data/admin.service'
import { formatCurrency } from '@/lib/mock-data'

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = AdminCommission['status'] | 'all'

interface DistributorSummary {
  id: string
  name: string
  pending: number
  overdue: number
  paid: number
  waived: number
  total: number
  commissionStatus?: 'ok' | 'overdue' | 'blocked'
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AdminCommission['status'], { label: string; className: string }> = {
  pending: { label: 'Pendiente', className: 'bg-amber-50 text-amber-700' },
  paid:    { label: 'Pagada',    className: 'bg-green-50 text-green-700' },
  overdue: { label: 'Vencida',   className: 'bg-red-50 text-red-700' },
  waived:  { label: 'Saldada',   className: 'bg-gray-100 text-gray-500' },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByDistributor(commissions: AdminCommission[]): DistributorSummary[] {
  const map: Record<string, DistributorSummary> = {}
  commissions.forEach(c => {
    if (!map[c.distributorId]) {
      map[c.distributorId] = { id: c.distributorId, name: c.distributorName, pending: 0, overdue: 0, paid: 0, waived: 0, total: 0 }
    }
    const s = map[c.distributorId]
    if (c.status === 'pending') s.pending += c.commissionAmount
    else if (c.status === 'overdue') s.overdue += c.commissionAmount
    else if (c.status === 'paid') s.paid += c.commissionAmount
    else if (c.status === 'waived') s.waived += c.commissionAmount
    s.total += c.commissionAmount
  })
  return Object.values(map).sort((a, b) => (b.overdue + b.pending) - (a.overdue + a.pending))
}

function formatPeriod(period: string): string {
  if (!period || !period.includes('-')) return period
  const [year, month] = period.split('-')
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${months[parseInt(month) - 1]} ${year}`
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminComisionesPage() {
  const [commissions, setCommissions] = useState<AdminCommission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [distFilter, setDistFilter] = useState<string>('all')
  const [blockingId, setBlockingId] = useState<string | null>(null)
  // Track per-distributor blocked status locally (from summary)
  const [distBlockStatus, setDistBlockStatus] = useState<Record<string, 'ok' | 'overdue' | 'blocked'>>({})

  useEffect(() => {
    getAdminCommissions().then(data => {
      setCommissions(data)
      setLoading(false)
    })
  }, [])

  const summary = groupByDistributor(commissions)
  const distributorNames = [...new Set(commissions.map(c => c.distributorName))].sort()

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0)
  const totalOverdue = commissions.filter(c => c.status === 'overdue').reduce((s, c) => s + c.commissionAmount, 0)
  const totalPaid    = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0)

  const filtered = commissions.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false
    if (distFilter !== 'all' && c.distributorName !== distFilter) return false
    return true
  })

  const markPaid = async (id: string) => {
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'paid' as const } : c))
    try { await adminMarkCommissionPaid(id) } catch {
      setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'pending' as const } : c))
    }
  }

  const waive = async (id: string) => {
    setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'waived' as const } : c))
    try { await adminWaiveCommission(id) } catch {
      setCommissions(prev => prev.map(c => c.id === id ? { ...c, status: 'pending' as const } : c))
    }
  }

  const toggleBlock = async (distId: string, currentStatus: 'ok' | 'overdue' | 'blocked') => {
    const newStatus = currentStatus === 'blocked' ? 'ok' : 'blocked'
    setBlockingId(distId)
    setDistBlockStatus(prev => ({ ...prev, [distId]: newStatus }))
    try {
      await adminSetDistributorCommissionStatus(distId, newStatus)
    } catch {
      setDistBlockStatus(prev => ({ ...prev, [distId]: currentStatus }))
    } finally {
      setBlockingId(null)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Comisiones</h1>
        <p className="text-gray-500 text-sm mt-1">Tasa base: 1.5% sobre pedidos entregados · Pago externo coordinado con la distribuidora</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Totals header */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Por cobrar</p>
              <p className="font-heading font-bold text-xl text-gray-900">{formatCurrency(totalPending)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Vencidas</p>
              <p className="font-heading font-bold text-xl text-gray-900">{formatCurrency(totalOverdue)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Cobradas</p>
              <p className="font-heading font-bold text-xl text-gray-900">{formatCurrency(totalPaid)}</p>
            </div>
          </div>

          {/* Summary cards per distributor */}
          {summary.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {summary.map(d => {
                const currentStatus = distBlockStatus[d.id] ?? d.commissionStatus ?? 'ok'
                const isBlocked = currentStatus === 'blocked'
                const isProcessing = blockingId === d.id
                return (
                  <div key={d.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${isBlocked ? 'border-red-200' : 'border-gray-100'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <p className="font-semibold text-gray-900 text-sm">{d.name}</p>
                      {isBlocked && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Bloqueada</span>
                      )}
                    </div>
                    <div className="space-y-1.5 text-sm mb-4">
                      {d.pending > 0 && (
                        <div className="flex justify-between">
                          <span className="text-amber-600 font-medium">Pendiente</span>
                          <span className="font-semibold">{formatCurrency(d.pending)}</span>
                        </div>
                      )}
                      {d.overdue > 0 && (
                        <div className="flex justify-between">
                          <span className="text-red-600 font-medium flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />Vencida
                          </span>
                          <span className="font-semibold">{formatCurrency(d.overdue)}</span>
                        </div>
                      )}
                      {d.paid > 0 && (
                        <div className="flex justify-between text-gray-400">
                          <span>Cobrada</span>
                          <span>{formatCurrency(d.paid)}</span>
                        </div>
                      )}
                      {d.waived > 0 && (
                        <div className="flex justify-between text-gray-400">
                          <span>Saldada</span>
                          <span>{formatCurrency(d.waived)}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleBlock(d.id, currentStatus)}
                      disabled={isProcessing}
                      className={`w-full h-8 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
                        isBlocked
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {isBlocked
                        ? <><Unlock className="h-3 w-3" /> Desbloquear</>
                        : <><Lock className="h-3 w-3" /> Bloquear distribuidora</>
                      }
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Status pills */}
            {(['all', 'pending', 'overdue', 'paid', 'waived'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {s === 'all' ? 'Todas' : STATUS_CONFIG[s].label}
              </button>
            ))}

            {/* Distributor selector */}
            {distributorNames.length > 1 && (
              <div className="relative ml-auto">
                <select
                  value={distFilter}
                  onChange={e => setDistFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold rounded-xl border border-gray-200 bg-white text-gray-600 hover:border-gray-300 focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="all">Todas las distribuidoras</option>
                  {distributorNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Commission table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider">Distribuidora</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden md:table-cell">Pedido</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Período</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Venta</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wider hidden lg:table-cell">Tasa</th>
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
                    <td className="px-4 py-4 text-gray-500 text-xs hidden lg:table-cell">{formatPeriod(c.period)}</td>
                    <td className="px-4 py-4 text-gray-600 hidden lg:table-cell">{formatCurrency(c.orderTotal)}</td>
                    <td className="px-4 py-4 text-gray-400 text-xs hidden lg:table-cell">{((c.commissionRate ?? 0.015) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-4 font-bold text-gray-900">{formatCurrency(c.commissionAmount)}</td>
                    <td className="px-4 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_CONFIG[c.status].className}`}>
                        {STATUS_CONFIG[c.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {(c.status === 'pending' || c.status === 'overdue') && (
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => markPaid(c.id)}
                            className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-green-700 hover:bg-green-50 transition-colors"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Cobrada
                          </button>
                          <button
                            onClick={() => waive(c.id)}
                            className="h-8 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-gray-400 hover:bg-gray-50 transition-colors"
                          >
                            <Ban className="h-3.5 w-3.5" /> Saldar
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-400 text-sm">
                {commissions.length === 0 ? 'No hay comisiones registradas aún' : 'Sin resultados para el filtro seleccionado'}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
