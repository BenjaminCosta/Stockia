'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, MapPin, Phone, Mail, FileText, Bell, Shield, ChevronRight, LogOut, Edit, Settings, TrendingUp, Package, Users, MessageSquare, Save, X, Star } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Distribuidora } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
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

const notifications = [
  { label: 'Nuevos pedidos', sub: 'Recibí una alerta cuando entra un pedido nuevo', defaultOn: true },
  { label: 'Cambios de estado', sub: 'Confirmaciones de pago y actualizaciones de entrega', defaultOn: true },
  { label: 'Stock bajo', sub: 'Te avisamos cuando un producto queda con poco stock', defaultOn: true },
  { label: 'Novedades de Stockia', sub: 'Actualizaciones de la plataforma y nuevas funciones', defaultOn: false },
]

// ─── Editable company info ─────────────────────────────────────────────────────

function EditableCompanySection({ distribuidora }: { distribuidora: Distribuidora | null }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    companyName: distribuidora?.companyName || '',
    phone: distribuidora?.phone || '',
    address: distribuidora?.address || '',
    city: distribuidora?.location?.city || '',
  })

  useEffect(() => {
    setForm({
      companyName: distribuidora?.companyName || '',
      phone: distribuidora?.phone || '',
      address: distribuidora?.address || '',
      city: distribuidora?.location?.city || '',
    })
  }, [distribuidora])

  const handleSave = async () => {
    if (!distribuidora?.id) return
    setSaving(true)
    try {
      await updateDocument(COLLECTIONS.distributors, distribuidora.id, {
        companyName: form.companyName,
        phone: form.phone,
        address: form.address,
        city: form.city,
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
    { key: 'city',        label: 'Ciudad',               icon: <MapPin className="h-5 w-5" />, type: 'text' },
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
    <div className="bg-white rounded-3xl shadow-sm border border-border p-6">
      <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-4" />
      <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-2xl animate-pulse" />)}</div>
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
  const city = distribuidora?.location?.city || 'Quilmes'

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
    { label: 'Zonas de entrega',  value: distribuidora?.deliveryZones?.join(' · ') || `${city} · Avellaneda · Lanús` },
    { label: 'Horario de pedidos',value: distribuidora?.deliveryHours || 'Lunes a Viernes · 8 a 17hs' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dark hero header */}
      <div className="bg-sidebar pt-8 pb-20 md:pb-24 px-4 md:px-8 relative md:rounded-b-3xl md:mt-4 md:mx-4 overflow-hidden shadow-lg">
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <circle cx="88%" cy="25%" r="90" fill="none" stroke="white" strokeWidth="5" />
          <rect x="3%" y="60%" width="80" height="80" fill="none" stroke="white" strokeWidth="4" transform="rotate(20)" />
        </svg>
        <div className="max-w-5xl mx-auto relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-3xl bg-primary flex items-center justify-center font-heading font-bold text-2xl md:text-3xl text-white shrink-0 border border-white/10 shadow-inner">
              {initials}
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl md:text-3xl text-white leading-tight">{companyName}</h1>
              <div className="flex items-center gap-1.5 text-white/70 text-sm md:text-base font-medium mt-2 bg-white/10 px-3 py-1 rounded-full w-max">
                <MapPin className="h-3.5 w-3.5" /> {city}, Buenos Aires
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating content */}
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
                  <span className="block text-xs text-muted-foreground mt-0.5">Contanos tu experiencia con Stockia</span>
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

            {/* Notifications */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Notificaciones</h2>
              <div className="space-y-6">
                {notifications.map((item, i) => (
                  <div key={i} className={`flex items-center justify-between gap-4 ${i !== 0 ? 'pt-6 border-t border-gray-100' : ''}`}>
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 items-center justify-center shrink-0 hidden md:flex">
                        <Bell className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-bold text-base text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">{item.sub}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={item.defaultOn} className="data-[state=checked]:bg-primary shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
    </div>
  )
}
