'use client'

import { useEffect, useState } from 'react'
import { Star, Eye, EyeOff, Search, Filter, MessageSquare, Store, Truck, CheckCircle2, Clock, RotateCcw, ExternalLink } from 'lucide-react'
import { getAllReviews, moderateReview } from '@/lib/data/reviews.service'
import { getAllCommerceReviews, moderateCommerceReview } from '@/lib/data/commerce-reviews.service'
import { getAllFeedback, updateFeedbackStatus } from '@/lib/data/feedback.service'
import type { Review, CommerceReview, PlatformFeedback } from '@/lib/types'
import { StarDisplay } from '@/components/star-rating'

// ─── Shared config ────────────────────────────────────────────────────────────

const reviewStatusConfig = {
  visible:  { label: 'Visible',   className: 'bg-green-50 text-green-700' },
  hidden:   { label: 'Oculta',    className: 'bg-gray-100 text-gray-500' },
  reported: { label: 'Reportada', className: 'bg-red-50 text-red-600' },
}

const feedbackStatusConfig = {
  new:      { label: 'Nueva',     className: 'bg-blue-50 text-blue-600',    icon: Clock },
  reviewed: { label: 'Revisada',  className: 'bg-amber-50 text-amber-700',  icon: Eye },
  resolved: { label: 'Resuelta',  className: 'bg-green-50 text-green-700',  icon: CheckCircle2 },
}

const feedbackCategoryConfig = {
  general:  { label: 'General',   className: 'bg-blue-50 text-blue-600' },
  problema: { label: 'Problema',  className: 'bg-red-50 text-red-600' },
  mejora:   { label: 'Mejora',    className: 'bg-amber-50 text-amber-700' },
  elogio:   { label: 'Elogio',    className: 'bg-emerald-50 text-emerald-700' },
}

const ratingFilters = [
  { value: 'all', label: 'Todas' },
  { value: '5',   label: '5 ★' },
  { value: '4',   label: '4 ★' },
  { value: '3',   label: '3 ★' },
  { value: 'low', label: '1-2 ★' },
]

type TabKey = 'distribuidoras' | 'comercios' | 'feedback'

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'distribuidoras', label: 'Reseñas a distribuidoras', icon: Truck },
  { key: 'comercios',      label: 'Reseñas a comercios',      icon: Store },
  { key: 'feedback',       label: 'Feedback StockIA',         icon: MessageSquare },
]

// ─── Criteria pill ────────────────────────────────────────────────────────────

function CriteriaPill({ label, value }: { label: string; value: number }) {
  const color =
    value >= 4 ? 'bg-green-50 text-green-700' :
    value === 3 ? 'bg-amber-50 text-amber-700' :
    'bg-red-50 text-red-600'
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label} {value}/5
    </span>
  )
}

// ─── Distributor review card ──────────────────────────────────────────────────

function DistributorReviewCard({
  review,
  onToggle,
}: {
  review: Review
  onToggle: (id: string, visible: boolean) => void
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${review.status !== 'visible' ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <StarDisplay rating={review.ratingGeneral} size="sm" showValue />
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${reviewStatusConfig[review.status].className}`}>
              {reviewStatusConfig[review.status].label}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-gray-700 leading-relaxed mb-2">&ldquo;{review.comment}&rdquo;</p>
          )}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <CriteriaPill label="Cumplimiento" value={review.ratingFulfillment} />
            <CriteriaPill label="Entrega" value={review.ratingDelivery} />
            <CriteriaPill label="Mercadería" value={review.ratingProductCondition} />
            <CriteriaPill label="Atención" value={review.ratingCommunication} />
          </div>
          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-600">{review.commerceName}</span>
            <span>→</span>
            <span className="font-medium text-gray-600">{review.distributorName}</span>
            <span>·</span>
            <span className="font-mono">{review.orderNumber}</span>
            <span>·</span>
            <span>{new Date(review.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <button
          onClick={() => onToggle(review.id, review.status === 'visible')}
          title={review.status === 'visible' ? 'Ocultar' : 'Publicar'}
          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${review.status === 'visible' ? 'text-gray-400 hover:bg-red-50 hover:text-red-500' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
        >
          {review.status === 'visible' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

// ─── Commerce review card ─────────────────────────────────────────────────────

function CommerceReviewCard({
  review,
  onToggle,
}: {
  review: CommerceReview
  onToggle: (id: string, visible: boolean) => void
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${review.status !== 'visible' ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <StarDisplay rating={review.ratingGeneral} size="sm" showValue />
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${reviewStatusConfig[review.status].className}`}>
              {reviewStatusConfig[review.status].label}
            </span>
          </div>
          {review.comment && (
            <p className="text-sm text-gray-700 leading-relaxed mb-2">&ldquo;{review.comment}&rdquo;</p>
          )}
          <div className="flex flex-wrap gap-1.5 mb-2">
            <CriteriaPill label="Pago" value={review.ratingPayment} />
            <CriteriaPill label="Recepción" value={review.ratingReception} />
            <CriteriaPill label="Comunicación" value={review.ratingCommunication} />
            <CriteriaPill label="Confiabilidad" value={review.ratingReliability} />
          </div>
          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-600">{review.distributorName}</span>
            <span>→</span>
            <span className="font-medium text-gray-600">{review.commerceName}</span>
            <span>·</span>
            <span className="font-mono">{review.orderNumber}</span>
            <span>·</span>
            <span>{new Date(review.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        <button
          onClick={() => onToggle(review.id, review.status === 'visible')}
          title={review.status === 'visible' ? 'Ocultar' : 'Publicar'}
          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${review.status === 'visible' ? 'text-gray-400 hover:bg-red-50 hover:text-red-500' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
        >
          {review.status === 'visible' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

// ─── Feedback card ────────────────────────────────────────────────────────────

function FeedbackCard({
  feedback,
  onStatusChange,
}: {
  feedback: PlatformFeedback
  onStatusChange: (id: string, status: PlatformFeedback['status']) => void
}) {
  const statusCfg = feedbackStatusConfig[feedback.status]
  const catCfg = feedbackCategoryConfig[feedback.category]
  const StatusIcon = statusCfg.icon

  const nextStatus: Record<PlatformFeedback['status'], PlatformFeedback['status']> = {
    new: 'reviewed',
    reviewed: 'resolved',
    resolved: 'new',
  }
  const nextLabel: Record<PlatformFeedback['status'], string> = {
    new: 'Marcar revisada',
    reviewed: 'Marcar resuelta',
    resolved: 'Reabrir',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${catCfg.className}`}>
              {catCfg.label}
            </span>
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold ${statusCfg.className}`}>
              <StatusIcon className="h-3 w-3" /> {statusCfg.label}
            </span>
            <StarDisplay rating={feedback.rating} size="sm" showValue />
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 leading-relaxed mb-2">
            &ldquo;{feedback.message}&rdquo;
          </p>

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-gray-400">
            <span className="font-medium text-gray-700">{feedback.userName}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${feedback.userRole === 'comercio' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
              {feedback.userRole === 'comercio' ? 'Comercio' : 'Distribuidora'}
            </span>
            {feedback.relatedOrderId && (
              <>
                <span>·</span>
                <span className="font-mono">{feedback.relatedOrderId.slice(0, 8).toUpperCase()}</span>
              </>
            )}
            <span>·</span>
            <span>{new Date(feedback.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={() => onStatusChange(feedback.id, nextStatus[feedback.status])}
          title={nextLabel[feedback.status]}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {nextLabel[feedback.status]}
        </button>
      </div>
    </div>
  )
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

function DistributorReviewsTab() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Review['status'] | 'all'>('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  useEffect(() => {
    getAllReviews().then(r => { setReviews(r); setLoading(false) })
  }, [])

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.commerceName.toLowerCase().includes(q) || r.distributorName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchRating = ratingFilter === 'all' ? true : ratingFilter === 'low' ? r.ratingGeneral <= 2 : r.ratingGeneral === parseInt(ratingFilter)
    return matchSearch && matchStatus && matchRating
  })

  const toggle = async (id: string, currentVisible: boolean) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: currentVisible ? 'hidden' : 'visible' } : r))
    try { await moderateReview(id, !currentVisible) }
    catch { setReviews(prev => prev.map(r => r.id === id ? { ...r, status: currentVisible ? 'visible' : 'hidden' } : r)) }
  }

  const avgRating = reviews.filter(r => r.status === 'visible').length > 0
    ? reviews.filter(r => r.status === 'visible').reduce((s, r) => s + r.ratingGeneral, 0) / reviews.filter(r => r.status === 'visible').length
    : 0

  return (
    <div className="space-y-4">
      <StatsRow
        total={reviews.length}
        visible={reviews.filter(r => r.status === 'visible').length}
        hidden={reviews.filter(r => r.status === 'hidden').length}
        avgRating={avgRating}
      />
      <Filters search={search} onSearch={setSearch} statusFilter={statusFilter} onStatusFilter={s => setStatusFilter(s as Review['status'] | 'all')} ratingFilter={ratingFilter} onRatingFilter={setRatingFilter} />
      {loading ? <Skeletons /> : (
        <div className="space-y-3">
          {filtered.map(r => <DistributorReviewCard key={r.id} review={r} onToggle={toggle} />)}
          {filtered.length === 0 && <EmptyMsg />}
        </div>
      )}
    </div>
  )
}

function CommerceReviewsTab() {
  const [reviews, setReviews] = useState<CommerceReview[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CommerceReview['status'] | 'all'>('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  useEffect(() => {
    getAllCommerceReviews().then(r => { setReviews(r); setLoading(false) })
  }, [])

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q || r.commerceName.toLowerCase().includes(q) || r.distributorName.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchRating = ratingFilter === 'all' ? true : ratingFilter === 'low' ? r.ratingGeneral <= 2 : r.ratingGeneral === parseInt(ratingFilter)
    return matchSearch && matchStatus && matchRating
  })

  const toggle = async (id: string, currentVisible: boolean) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: currentVisible ? 'hidden' : 'visible' } : r))
    try { await moderateCommerceReview(id, !currentVisible) }
    catch { setReviews(prev => prev.map(r => r.id === id ? { ...r, status: currentVisible ? 'visible' : 'hidden' } : r)) }
  }

  const avgRating = reviews.filter(r => r.status === 'visible').length > 0
    ? reviews.filter(r => r.status === 'visible').reduce((s, r) => s + r.ratingGeneral, 0) / reviews.filter(r => r.status === 'visible').length
    : 0

  return (
    <div className="space-y-4">
      <StatsRow
        total={reviews.length}
        visible={reviews.filter(r => r.status === 'visible').length}
        hidden={reviews.filter(r => r.status === 'hidden').length}
        avgRating={avgRating}
      />
      <Filters search={search} onSearch={setSearch} statusFilter={statusFilter} onStatusFilter={s => setStatusFilter(s as CommerceReview['status'] | 'all')} ratingFilter={ratingFilter} onRatingFilter={setRatingFilter} />
      {loading ? <Skeletons /> : (
        <div className="space-y-3">
          {filtered.map(r => <CommerceReviewCard key={r.id} review={r} onToggle={toggle} />)}
          {filtered.length === 0 && <EmptyMsg />}
        </div>
      )}
    </div>
  )
}

function FeedbackTab() {
  const [feedback, setFeedback] = useState<PlatformFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PlatformFeedback['status'] | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<'all' | 'comercio' | 'distribuidora'>('all')
  const [catFilter, setCatFilter] = useState<PlatformFeedback['category'] | 'all'>('all')

  useEffect(() => {
    getAllFeedback().then(f => { setFeedback(f); setLoading(false) })
  }, [])

  const filtered = feedback.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !q || f.userName.toLowerCase().includes(q) || f.message.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || f.status === statusFilter
    const matchRole = roleFilter === 'all' || f.userRole === roleFilter
    const matchCat = catFilter === 'all' || f.category === catFilter
    return matchSearch && matchStatus && matchRole && matchCat
  })

  const handleStatusChange = async (id: string, status: PlatformFeedback['status']) => {
    setFeedback(prev => prev.map(f => f.id === id ? { ...f, status } : f))
    try { await updateFeedbackStatus(id, status) }
    catch { /* revert on error not needed — UI is optimistic */ }
  }

  const newCount = feedback.filter(f => f.status === 'new').length
  const reviewedCount = feedback.filter(f => f.status === 'reviewed').length
  const resolvedCount = feedback.filter(f => f.status === 'resolved').length
  const avgRating = feedback.length > 0 ? feedback.reduce((s, f) => s + f.rating, 0) / feedback.length : 0

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={feedback.length} />
        <StatCard label="Nuevos" value={newCount} highlight={newCount > 0} color="text-blue-600" />
        <StatCard label="En revisión" value={reviewedCount} color="text-amber-600" />
        <StatCard label="Promedio" value={avgRating > 0 ? avgRating.toFixed(1) + ' ★' : '—'} color="text-amber-500" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario o mensaje..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'new', 'reviewed', 'resolved'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {s === 'all' ? 'Todos' : feedbackStatusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'comercio', 'distribuidora'] as const).map(r => (
          <button key={r} onClick={() => setRoleFilter(r)} className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${roleFilter === r ? 'bg-[#0B1A45] text-white border-[#0B1A45]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {r === 'all' ? 'Todos los roles' : r === 'comercio' ? 'Comercios' : 'Distribuidoras'}
          </button>
        ))}
        {(['all', 'general', 'problema', 'mejora', 'elogio'] as const).map(c => (
          <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${catFilter === c ? 'bg-amber-400 text-white border-amber-400' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {c === 'all' ? 'Categorías' : feedbackCategoryConfig[c].label}
          </button>
        ))}
      </div>

      {loading ? <Skeletons /> : (
        <div className="space-y-3">
          {filtered.map(f => <FeedbackCard key={f.id} feedback={f} onStatusChange={handleStatusChange} />)}
          {filtered.length === 0 && <EmptyMsg label="Sin feedback con estos filtros" />}
        </div>
      )}
    </div>
  )
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function StatsRow({ total, visible, hidden, avgRating }: { total: number; visible: number; hidden: number; avgRating: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard label="Total" value={total} />
      <StatCard label="Publicadas" value={visible} color="text-green-600" />
      <StatCard label="Ocultas" value={hidden} color={hidden > 0 ? 'text-gray-500' : undefined} />
      <StatCard label="Promedio" value={avgRating > 0 ? avgRating.toFixed(1) + ' ★' : '—'} color="text-amber-500" />
    </div>
  )
}

function StatCard({ label, value, color, highlight }: { label: string; value: string | number; color?: string; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 text-center ${highlight ? 'border-blue-200' : 'border-gray-100'}`}>
      <p className={`text-2xl font-bold font-heading ${color || 'text-gray-900'}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
    </div>
  )
}

function Filters({
  search, onSearch,
  statusFilter, onStatusFilter,
  ratingFilter, onRatingFilter,
}: {
  search: string; onSearch: (v: string) => void
  statusFilter: string; onStatusFilter: (v: string) => void
  ratingFilter: string; onRatingFilter: (v: string) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Buscar por comercio, distribuidora o comentario..." className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-gray-400 self-center shrink-0" />
          {(['all', 'visible', 'hidden', 'reported'] as const).map(s => (
            <button key={s} onClick={() => onStatusFilter(s)} className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${statusFilter === s ? 'bg-primary text-white border-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {s === 'all' ? 'Todas' : reviewStatusConfig[s].label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {ratingFilters.map(f => (
          <button key={f.value} onClick={() => onRatingFilter(f.value)} className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${ratingFilter === f.value ? 'bg-amber-400 text-white border-amber-400' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function Skeletons() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />)}
    </div>
  )
}

function EmptyMsg({ label = 'Sin reseñas con estos filtros' }: { label?: string }) {
  return (
    <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
      {label}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminRatingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('distribuidoras')

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-6xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Reseñas y Feedback</h1>
        <p className="text-gray-500 text-sm mt-1">Gestión de calificaciones y feedback interno de la plataforma</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1">
        {TABS.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {activeTab === 'distribuidoras' && <DistributorReviewsTab />}
      {activeTab === 'comercios'      && <CommerceReviewsTab />}
      {activeTab === 'feedback'       && <FeedbackTab />}
    </div>
  )
}
