'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, MapPin, Phone, Mail, FileText, Shield, ChevronRight, LogOut, Edit, Settings, TrendingUp, Package, Users, MessageSquare, Save, X, Star } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Distribuidora } from '@/lib/types'
import { formatCurrency } from '@/lib/mock-data'
import { FeedbackModal } from '@/components/FeedbackModal'
import { useProducts, useDistribuidoraOrders } from '@/hooks/use-data'
import { updateDocument } from '@/lib/firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getDistributorRatingSummary } from '@/lib/data/reviews.service'
import { getReviewsByDistributor } from '@/lib/data/reviews.service'
import type { Review } from '@/lib/types'
import { StarDisplay } from '@/components/star-rating'
import Link from 'next/link'
import { LocationSelector, LocationSelectorValue } from '@/components/location-selector'
import { normalizeLocationInput } from '@/lib/locations/location-utils'
import { SkeletonBlock } from '@/components/ui/SkeletonCard'

// ─── Editable company info ─────────────────────────────────────────────────────

function EditableCompanySection({ distribuidora }: { distribuidora: Distribuidora | null }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    companyName: distribuidora?.companyName || '',
    phone: distribuidora?.phone || '',
    address: distribuidora?.address || '',
  })
  const [location, setLocation] = useState<LocationSelectorValue>({
    province: distribuidora?.location?.province || '',
    city: distribuidora?.location?.city || '',
  })

  useEffect(() => {
    setForm({
      companyName: distribuidora?.companyName || '',
      phone: distribuidora?.phone || '',
      address: distribuidora?.address || '',
    })
    setLocation({
      province: distribuidora?.location?.province || '',
      city: distribuidora?.location?.city || '',
    })
  }, [distribuidora])

  const handleSave = async () => {
    if (!distribuidora?.id) return
    setSaving(true)
    try {
      const normalizedLocation = normalizeLocationInput(location)
      await updateDocument(COLLECTIONS.distributors, distribuidora.id, {
        companyName: form.companyName,
        phone: form.phone,
        address: form.address,
        city: normalizedLocation.city,
        citySlug: normalizedLocation.citySlug,
        province: normalizedLocation.province,
        provinceSlug: normalizedLocation.provinceSlug,
        locationKey: normalizedLocation.locationKey,
        lat: null,
        lng: null,
        location: normalizedLocation,
      })
      setSaved(true)
      setEditing(false)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('[perfil] updateDocument(distributors) failed', err)
    } finally {
      setSaving(false)
    }
  }

  const editableFields = [
    { key: 'companyName', label: 'Nombre de fantasía', icon: <Truck className="h-5 w-5" />, type: 'text' },
    { key: 'phone',       label: 'Teléfono',            icon: <Phone className="h-5 w-5" />, type: 'tel' },
    { key: 'address',     label: 'Dirección',            icon: <MapPin className="h-5 w-5" />, type: 'text' },
  ] as const

  const staticFields = [
    { label: 'Razón Social', icon: <FileText className="h-5 w-5" />, value: distribuidora?.razonSocial || '—' },
    { label: 'CUIT',         icon: <FileText className="h-5 w-5" />, value: distribuidora?.cuit || '—' },
    { label: 'Email',        icon: <Mail className="h-5 w-5" />,     value: distribuidora?.email || '—' },
  ]

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Datos de la empresa</h2>
        <div className="flex items-center gap-2">
          {saved && <span className="text-xs text-emerald-600 font-semibold">¡Guardado!</span>}
          {editing ? (
            <>
              <button onClick={() => setEditing(false)} className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <X className="h-4 w-4" />
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C8FF00] text-[#0B1A45] text-xs font-bold hover:bg-[#b8ef00] disabled:opacity-50 transition-colors">
                <Save className="h-3.5 w-3.5" /> {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              <Edit className="h-3.5 w-3.5" /> Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {editableFields.map(f => (
          <div key={f.key} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="h-10 w-10 rounded-xl bg-white shadow-sm text-primary flex items-center justify-center shrink-0">{f.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{f.label}</p>
              {editing ? (
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full font-bold text-sm text-foreground bg-white border border-[#C8FF00]/60 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#C8FF00]/40"
                />
              ) : (
                <p className="font-bold text-sm text-foreground truncate">{form[f.key] || '—'}</p>
              )}
            </div>
          </div>
        ))}
        <div className="md:col-span-2 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
          {editing ? (
            <LocationSelector value={location} onChange={setLocation} compact />
          ) : (
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-white shadow-sm text-primary flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Ubicación base</p>
                <p className="font-bold text-sm text-foreground truncate">
                  {[location.city, location.province].filter(Boolean).join(', ') || '—'}
                </p>
              </div>
            </div>
          )}
        </div>
        {staticFields.map((f, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
            <div className="h-10 w-10 rounded-xl bg-white shadow-sm text-primary flex items-center justify-center shrink-0">{f.icon}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{f.label}</p>
              <p className="font-bold text-sm text-foreground truncate">{f.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Reviews summary (from commerces) ─────────────────────────────────────────

function DistribuidoraReviewsSection({ distId }: { distId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getDistributorRatingSummary>> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getReviewsByDistributor(distId),
      getDistributorRatingSummary(distId),
    ]).then(([revs, sum]) => {
      setReviews(revs.slice(0, 3)) // show only the 3 most recent
      setSummary(sum)
      setLoading(false)
    })
  }, [distId])

  if (loading) return (
    <div className="rounded-3xl border border-[#DFE1E8] bg-white p-6 shadow-[0_14px_38px_rgba(11,26,69,0.06)]" aria-busy="true" aria-label="Cargando resenas">
      <SkeletonBlock className="mb-5 h-4 w-36" />
      <div className="mb-4 flex items-center gap-4 rounded-2xl bg-[#F7F8FA] p-4">
        <SkeletonBlock className="h-16 w-16 shrink-0 rounded-2xl" />
        <div className="grid flex-1 grid-cols-2 gap-2">
          {[0, 1, 2, 3].map(item => (
            <SkeletonBlock key={item} className="h-12 rounded-xl bg-white" />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {[0, 1].map(item => (
          <SkeletonBlock key={item} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Reseñas recibidas</h2>
        <Link href="/distribuidora/resenas" className="text-xs text-primary font-semibold hover:underline">
          Ver todas →
        </Link>
      </div>

      {summary && summary.reviewCount > 0 ? (
        <>
          {/* Summary */}
          <div className="flex items-center gap-4 mb-4 p-4 bg-gray-50 rounded-2xl">
            <div className="text-center shrink-0">
              <p className="font-heading font-bold text-4xl text-gray-900 leading-none">{summary.averageGeneral.toFixed(1)}</p>
              <StarDisplay rating={summary.averageGeneral} size="sm" className="mt-1.5 justify-center" />
              <p className="text-xs text-gray-400 mt-1">{summary.reviewCount} reseña{summary.reviewCount !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              {[
                { label: 'Cumplimiento', value: summary.averageFulfillment },
                { label: 'Entrega',      value: summary.averageDelivery },
                { label: 'Mercadería',   value: summary.averageProductCondition },
                { label: 'Atención',     value: summary.averageCommunication },
              ].map(c => (
                <div key={c.label} className="text-center bg-white rounded-xl p-2 shadow-sm">
                  <p className={`font-heading font-bold text-base ${c.value >= 4 ? 'text-emerald-600' : c.value >= 3 ? 'text-amber-600' : 'text-red-500'}`}>{c.value.toFixed(1)}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Last 3 reviews */}
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="border border-gray-100 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <p className="font-semibold text-sm text-gray-800">{r.commerceName}</p>
                  <StarDisplay rating={r.ratingGeneral} size="sm" showValue />
                </div>
                {r.comment && <p className="text-sm text-gray-500 leading-relaxed">&ldquo;{r.comment}&rdquo;</p>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-12 w-12 rounded-full bg-amber-50 flex items-center justify-center mb-3">
            <Star className="h-6 w-6 text-amber-300" />
          </div>
          <p className="font-semibold text-gray-600 text-sm">Aún sin reseñas</p>
          <p className="text-xs text-gray-400 mt-1">Los comercios podrán calificarte luego de cada pedido entregado.</p>
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function PerfilDistribuidoraPage() {
  const router = useRouter()
  const { currentUser, logout } = useApp()
  const [showFeedback, setShowFeedback] = useState(false)
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null

  const companyName = distribuidora?.companyName || 'Mi distribuidora'
  const initials = companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const city = distribuidora?.location?.city || ''
  const province = distribuidora?.location?.province || ''

  const { data: products } = useProducts(distribuidora?.id || 'dist-1')
  const { data: orders } = useDistribuidoraOrders(distribuidora?.id || 'dist-1')
  const todaySales = orders.reduce((sum: number, o: any) => sum + o.total, 0)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const configFields = [
    { label: 'Pedido mínimo',     value: distribuidora?.minOrder ? formatCurrency(distribuidora.minOrder) : '$15.000' },
    { label: 'Tiempo de entrega', value: distribuidora?.deliveryTimeLabel || '48 horas hábiles' },
    { label: 'Zonas de entrega',  value: distribuidora?.deliveryZones?.join(' · ') || (city ? `${city}, ${province || 'Argentina'}` : 'Sin zonas configuradas') },
    { label: 'Horario de pedidos',value: distribuidora?.deliveryHours || 'Lunes a Viernes · 8 a 17hs' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative overflow-hidden bg-[#080f2b] px-4 pb-20 pt-7 shadow-[0_18px_52px_rgba(8,15,43,0.18)] md:mx-4 md:mt-4 md:rounded-b-[1.75rem] md:px-8 md:pb-24 md:pt-8">
        <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#0B1A45] opacity-80 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-[#0B1A45]/60 blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 top-0 h-32 w-32 rounded-full bg-lima/4 blur-3xl pointer-events-none" />

        <svg className="absolute inset-0 h-full w-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <circle cx="92%" cy="-10%" r="38%" fill="none" stroke="white" strokeWidth="32" />
          <circle cx="8%" cy="110%" r="22%" fill="none" stroke="white" strokeWidth="20" />
          <line x1="0" y1="100%" x2="100%" y2="0" stroke="white" strokeWidth="0.8" opacity="0.6" />
          <line x1="0" y1="70%" x2="70%" y2="0" stroke="white" strokeWidth="0.5" opacity="0.4" />
          <circle cx="15%" cy="30%" r="1.5" fill="white" opacity="0.5" />
          <circle cx="22%" cy="55%" r="1" fill="white" opacity="0.3" />
        </svg>

        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(255,255,255,1)_1px,transparent_1px)] bg-size-[18px_18px] pointer-events-none" />

        <div className="relative z-10 mx-auto flex max-w-5xl items-start justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/45 bg-white font-heading text-2xl font-bold text-[#080f2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_34px_rgba(0,0,0,0.22)] md:h-24 md:w-24 md:rounded-3xl md:text-4xl">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-lima/60 md:text-xs">
                Cuenta distribuidora
              </p>
              <h1 className="font-heading text-xl font-bold leading-tight tracking-tight text-white md:text-4xl">{companyName}</h1>
              <div className="mt-2 flex w-max max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-medium text-white/70 md:text-base">
                <MapPin className="h-3.5 w-3.5" /> {[city, province].filter(Boolean).join(', ') || 'Argentina'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 -mt-8 md:-mt-12 relative z-10 pb-12 max-w-5xl mx-auto w-full">

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left column */}
          <div className="md:col-span-4 space-y-6">
            {/* Stats card */}
            <div className="bg-white rounded-3xl shadow-md border border-border p-6">
              <div className="grid grid-cols-3 md:grid-cols-1 md:divide-y divide-x md:divide-x-0 divide-gray-100">
                <div className="pr-4 md:pr-0 md:pb-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center justify-center gap-1 mb-1 md:hidden">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 md:mb-0 text-center md:text-left">Ventas</p>
                  <p className="font-heading font-bold text-xl md:text-2xl text-foreground text-center md:text-left">
                    ${todaySales.toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="px-4 md:px-0 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center justify-center gap-1 mb-1 md:hidden">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 md:mb-0 text-center md:text-left">Productos</p>
                  <p className="font-heading font-bold text-xl md:text-2xl text-foreground text-center md:text-left">{products.length}</p>
                </div>
                <div className="pl-4 md:pl-0 md:pt-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center justify-center gap-1 mb-1 md:hidden">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 md:mb-0 text-center md:text-left">Clientes</p>
                  <p className="font-heading font-bold text-xl md:text-2xl text-foreground text-center md:text-left">{orders.length}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-3xl shadow-sm border border-border divide-y divide-gray-100 overflow-hidden">
              <a href="/distribuidora/zonas" className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-foreground">Zonas de entrega</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Cobertura y radio de reparto</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </a>
              <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-foreground">Seguridad</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Contraseña y acceso</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Settings className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-foreground">Configuración</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Preferencias y notificaciones</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => setShowFeedback(true)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-foreground">Enviar feedback</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Contanos tu experiencia con StockIA</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-red-50 transition-colors group"
              >
                <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <span className="flex-1 font-bold text-sm text-red-600">Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-8 space-y-6">
            <EditableCompanySection distribuidora={distribuidora} />

            {/* Operational config */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Configuración operativa</h2>
                <a href="/distribuidora/zonas" className="text-xs text-primary font-semibold hover:underline">Editar →</a>
              </div>
              <div className="space-y-4">
                {configFields.map((item, i) => (
                  <div key={i} className={`flex flex-col md:flex-row md:justify-between md:items-center gap-1 md:gap-4 ${i !== 0 ? 'pt-4 border-t border-gray-100' : ''}`}>
                    <p className="text-sm font-bold text-gray-500">{item.label}</p>
                    <p className="font-bold text-sm text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            {distribuidora?.id && <DistribuidoraReviewsSection distId={distribuidora.id} />}
          </div>
        </div>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}
