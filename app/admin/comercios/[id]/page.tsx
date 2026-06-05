'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  CreditCard,
  ShieldOff,
  ShieldCheck,
  Store,
} from 'lucide-react'
import {
  getAdminCommerceById,
  adminSetCommerceStatus,
  type AdminCommerce,
} from '@/lib/data/admin.service'
import { formatCurrency } from '@/lib/utils'

const statusConfig = {
  active:  { label: 'Activo',       className: 'bg-green-50 text-green-700 border-green-200' },
  review:  { label: 'En revisión',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
  blocked: { label: 'Bloqueado',    className: 'bg-red-50 text-red-700 border-red-200' },
}

function DetailField({ label, value, href }: { label: string; value?: string; href?: string }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      {href ? (
        <a href={href} className="text-sm text-primary font-medium hover:underline break-all">{value}</a>
      ) : (
        <p className="text-sm text-gray-800 font-medium">{value}</p>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="font-heading font-bold text-xl text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto w-full animate-pulse">
      <div className="h-6 w-24 bg-[#EEF1F5] rounded-lg mb-6" />
      <div className="h-8 w-56 bg-[#EEF1F5] rounded-xl mb-2" />
      <div className="h-5 w-20 bg-[#EEF1F5] rounded-full mb-6" />
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-[#EEF1F5] rounded-2xl" />)}
      </div>
      <div className="space-y-4">
        <div className="h-48 bg-[#EEF1F5] rounded-2xl" />
        <div className="h-28 bg-[#EEF1F5] rounded-2xl" />
      </div>
    </div>
  )
}

export default function AdminComercioDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [commerce, setCommerce] = useState<AdminCommerce | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    getAdminCommerceById(id).then(data => { setCommerce(data); setLoading(false) })
  }, [id])

  const setStatus = async (newStatus: AdminCommerce['status']) => {
    if (!commerce || toggling || newStatus === commerce.status) return
    const prevStatus = commerce.status
    setToggling(true)
    setCommerce(prev => prev ? { ...prev, status: newStatus } : prev)
    try {
      await adminSetCommerceStatus(id, newStatus)
    } catch {
      setCommerce(prev => prev ? { ...prev, status: prevStatus } : prev)
    } finally {
      setToggling(false)
    }
  }

  if (loading) return <DetailSkeleton />

  if (!commerce) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto w-full">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <p className="text-gray-400 text-sm">Comercio no encontrado.</p>
      </div>
    )
  }

  const sc = statusConfig[commerce.status]

  const joinedLabel = commerce.joinedAt
    ? new Date(commerce.joinedAt + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto w-full">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Comercios
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-2xl text-gray-900 truncate">{commerce.businessName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${sc.className}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${commerce.status === 'active' ? 'bg-green-500' : commerce.status === 'blocked' ? 'bg-red-500' : 'bg-amber-500'}`} />
              {sc.label}
            </span>
          </div>
        </div>
        <button
          onClick={() => setStatus(commerce.status === 'blocked' ? 'active' : 'blocked')}
          disabled={toggling}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
            commerce.status === 'blocked'
              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
              : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          }`}
        >
          {commerce.status === 'blocked'
            ? <><ShieldCheck className="h-3.5 w-3.5" /> Desbloquear</>
            : <><ShieldOff className="h-3.5 w-3.5" /> Bloquear</>
          }
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <KpiCard label="Pedidos" value={String(commerce.totalOrders)} />
        <KpiCard label="Total gastado" value={formatCurrency(commerce.totalSpent)} />
        <KpiCard label="Miembro desde" value={commerce.joinedAt ? new Date(commerce.joinedAt + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'} />
      </div>

      {/* Datos de cuenta */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Store className="h-4 w-4 text-gray-400" /> Datos de cuenta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex items-start gap-2.5">
            <Mail className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
            <DetailField label="Email" value={commerce.email} href={`mailto:${commerce.email}`} />
          </div>
          <div className="flex items-start gap-2.5">
            <Phone className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
            <DetailField label="Teléfono" value={commerce.phone} href={`tel:${commerce.phone}`} />
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
            <DetailField label="Dirección" value={[commerce.address, commerce.city].filter(Boolean).join(', ')} />
          </div>
          <div className="flex items-start gap-2.5">
            <Calendar className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
            <DetailField label="Miembro desde" value={joinedLabel} />
          </div>
          {commerce.razonSocial && (
            <div className="flex items-start gap-2.5">
              <Building2 className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              <DetailField label="Razón Social" value={commerce.razonSocial} />
            </div>
          )}
          {commerce.cuit && (
            <div className="flex items-start gap-2.5">
              <CreditCard className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              <DetailField label="CUIT" value={commerce.cuit} />
            </div>
          )}
        </div>
      </div>

      {/* Estado de cuenta */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-heading font-semibold text-gray-900 mb-4">Estado de cuenta</h2>
        <div className="flex flex-wrap gap-2">
          {(['active', 'review', 'blocked'] as const).map(s => {
            const cfg = statusConfig[s]
            const isActive = commerce.status === s
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                disabled={toggling}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                  isActive
                    ? cfg.className
                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {isActive && <span className={`h-1.5 w-1.5 rounded-full ${s === 'active' ? 'bg-green-500' : s === 'blocked' ? 'bg-red-500' : 'bg-amber-500'}`} />}
                {cfg.label}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {commerce.status === 'blocked'
            ? 'El comercio no puede realizar pedidos mientras está bloqueado.'
            : commerce.status === 'review'
            ? 'La cuenta está bajo revisión. El comercio puede operar normalmente.'
            : 'La cuenta está activa y operando con normalidad.'}
        </p>
      </div>
    </div>
  )
}
