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
  Clock,
  ShoppingCart,
  Pause,
  Play,
  BadgeCheck,
  AlertTriangle,
  ShieldOff,
  Package,
} from 'lucide-react'
import {
  getAdminDistributorById,
  adminSetDistributorStatus,
  type AdminDistributor,
} from '@/lib/data/admin.service'
import { formatCurrency } from '@/lib/utils'

const statusConfig = {
  active:  { label: 'Activa',       className: 'bg-green-50 text-green-700 border-green-200' },
  paused:  { label: 'Pausada',      className: 'bg-gray-100 text-gray-600 border-gray-200' },
  review:  { label: 'En revisión',  className: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const commStatusConfig = {
  ok:      { label: 'Al día',     icon: BadgeCheck,      className: 'text-green-600 bg-green-50 border-green-200' },
  overdue: { label: 'Vencida',    icon: AlertTriangle,   className: 'text-amber-600 bg-amber-50 border-amber-200' },
  blocked: { label: 'Bloqueada',  icon: ShieldOff,       className: 'text-red-600 bg-red-50 border-red-200' },
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
        <div className="h-40 bg-[#EEF1F5] rounded-2xl" />
      </div>
    </div>
  )
}

export default function AdminDistribuidoraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [distributor, setDistributor] = useState<AdminDistributor | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    getAdminDistributorById(id).then(data => { setDistributor(data); setLoading(false) })
  }, [id])

  const toggleStatus = async () => {
    if (!distributor || toggling) return
    const newStatus = distributor.status === 'active' ? 'paused' : 'active'
    setToggling(true)
    setDistributor(prev => prev ? { ...prev, status: newStatus } : prev)
    try {
      await adminSetDistributorStatus(id, newStatus)
    } catch {
      setDistributor(prev => prev ? { ...prev, status: distributor.status } : prev)
    } finally {
      setToggling(false)
    }
  }

  if (loading) return <DetailSkeleton />

  if (!distributor) {
    return (
      <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto w-full">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <p className="text-gray-400 text-sm">Distribuidora no encontrada.</p>
      </div>
    )
  }

  const sc = statusConfig[distributor.status]
  const cs = distributor.commissionStatus ? commStatusConfig[distributor.commissionStatus] : null
  const CommIcon = cs?.icon

  const joinedLabel = distributor.joinedAt
    ? new Date(distributor.joinedAt + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto w-full">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Distribuidoras
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="font-heading font-bold text-2xl text-gray-900 truncate">{distributor.companyName}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${sc.className}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${distributor.status === 'active' ? 'bg-green-500' : distributor.status === 'paused' ? 'bg-gray-400' : 'bg-amber-500'}`} />
              {sc.label}
            </span>
            {cs && CommIcon && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold border ${cs.className}`}>
                <CommIcon className="h-3 w-3" />
                Comisión {cs.label}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={toggleStatus}
          disabled={toggling}
          className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
            distributor.status === 'active'
              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
          }`}
        >
          {distributor.status === 'active'
            ? <><Pause className="h-3.5 w-3.5" /> Pausar</>
            : <><Play className="h-3.5 w-3.5" /> Activar</>
          }
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <KpiCard label="Pedidos" value={String(distributor.totalOrders)} />
        <KpiCard label="Facturado" value={formatCurrency(distributor.totalRevenue)} />
        <KpiCard
          label="Com. pendiente"
          value={distributor.pendingCommission > 0 ? formatCurrency(distributor.pendingCommission) : '—'}
          sub={distributor.pendingCommission > 0 ? 'por cobrar' : undefined}
        />
      </div>

      {/* Datos de cuenta */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <h2 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" /> Datos de cuenta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
          <div className="flex items-start gap-2.5">
            <Mail className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
            <DetailField label="Email" value={distributor.email} href={`mailto:${distributor.email}`} />
          </div>
          <div className="flex items-start gap-2.5">
            <Phone className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
            <DetailField label="Teléfono" value={distributor.phone} href={`tel:${distributor.phone}`} />
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
            <DetailField label="Dirección" value={[distributor.address, distributor.city].filter(Boolean).join(', ')} />
          </div>
          <div className="flex items-start gap-2.5">
            <Calendar className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
            <DetailField label="Miembro desde" value={joinedLabel} />
          </div>
          {distributor.razonSocial && (
            <div className="flex items-start gap-2.5">
              <Building2 className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              <DetailField label="Razón Social" value={distributor.razonSocial} />
            </div>
          )}
          {distributor.cuit && (
            <div className="flex items-start gap-2.5">
              <CreditCard className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
              <DetailField label="CUIT" value={distributor.cuit} />
            </div>
          )}
        </div>
      </div>

      {/* Operativa */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-heading font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="h-4 w-4 text-gray-400" /> Operativa
        </h2>
        <div className="space-y-4">
          {/* Categories */}
          {distributor.categories.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categorías</p>
              <div className="flex flex-wrap gap-2">
                {distributor.categories.map(cat => (
                  <span key={cat} className="text-xs px-3 py-1 bg-primary/8 text-primary rounded-full font-medium border border-primary/20">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {distributor.minOrder !== undefined && (
              <div className="flex items-start gap-2.5">
                <ShoppingCart className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                <DetailField label="Pedido mínimo" value={formatCurrency(distributor.minOrder)} />
              </div>
            )}
            {distributor.deliveryTimeLabel && (
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                <DetailField label="Tiempo de entrega" value={distributor.deliveryTimeLabel} />
              </div>
            )}
            {distributor.deliveryHours && (
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                <DetailField label="Horario" value={distributor.deliveryHours} />
              </div>
            )}
            {distributor.commissionRate !== undefined && (
              <div className="flex items-start gap-2.5">
                <CreditCard className="h-4 w-4 text-gray-300 mt-0.5 shrink-0" />
                <DetailField label="Tasa de comisión" value={`${(distributor.commissionRate * 100).toFixed(1)}%`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
