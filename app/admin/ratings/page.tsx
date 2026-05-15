'use client'

import { useEffect, useState } from 'react'
import { Star, Eye, EyeOff, Search, Filter } from 'lucide-react'
import { getAllReviews, moderateReview } from '@/lib/data/reviews.service'
import { Review } from '@/lib/types'
import { StarDisplay } from '@/components/star-rating'

const statusConfig = {
  visible:  { label: 'Visible',   className: 'bg-green-50 text-green-700' },
  hidden:   { label: 'Oculta',    className: 'bg-gray-100 text-gray-500' },
  reported: { label: 'Reportada', className: 'bg-red-50 text-red-600' },
}

const ratingFilters = [
  { value: 'all', label: 'Todas' },
  { value: '5', label: '⭐ 5 estrellas' },
  { value: '4', label: '⭐ 4 estrellas' },
  { value: '3', label: '⭐ 3 estrellas' },
  { value: 'low', label: '⭐ 1-2 (negativas)' },
]

export default function AdminRatingsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<Review['status'] | 'all'>('all')
  const [ratingFilter, setRatingFilter] = useState('all')

  useEffect(() => {
    getAllReviews().then(r => { setReviews(r); setLoading(false) })
  }, [])

  const filtered = reviews.filter(r => {
    const matchSearch =
      r.commerceName.toLowerCase().includes(search.toLowerCase()) ||
      r.distributorName.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || r.status === statusFilter
    const matchRating =
      ratingFilter === 'all' ? true :
      ratingFilter === 'low' ? r.ratingGeneral <= 2 :
      r.ratingGeneral === parseInt(ratingFilter)
    return matchSearch && matchStatus && matchRating
  })

  const avgRating = reviews.filter(r => r.status === 'visible').length > 0
    ? reviews.filter(r => r.status === 'visible').reduce((s, r) => s + r.ratingGeneral, 0) / reviews.filter(r => r.status === 'visible').length
    : 0
  const hiddenCount = reviews.filter(r => r.status === 'hidden').length
  const reportedCount = reviews.filter(r => r.status === 'reported').length

  const toggleVisibility = async (id: string, currentVisible: boolean) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, status: currentVisible ? 'hidden' : 'visible' } : r))
    try {
      await moderateReview(id, !currentVisible)
    } catch (err) {
      console.error('Error moderating review:', err)
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: currentVisible ? 'visible' : 'hidden' } : r))
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-gray-900">Reseñas</h1>
        <p className="text-gray-500 text-sm mt-1">{reviews.length} reseñas en total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-900 font-heading">{avgRating.toFixed(1)}</p>
          <StarDisplay rating={avgRating} size="sm" className="justify-center mt-1" />
          <p className="text-xs text-gray-400 mt-1">Promedio general</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600 font-heading">{reviews.filter(r => r.status === 'visible').length}</p>
          <p className="text-xs text-gray-400 mt-1">Publicadas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold font-heading ${hiddenCount > 0 ? 'text-gray-500' : 'text-gray-300'}`}>{hiddenCount}</p>
          <p className="text-xs text-gray-400 mt-1">Ocultas</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className={`text-2xl font-bold font-heading ${reportedCount > 0 ? 'text-red-500' : 'text-gray-300'}`}>{reportedCount}</p>
          <p className="text-xs text-gray-400 mt-1">Reportadas</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por comercio, distribuidora o comentario..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            {(['all', 'visible', 'hidden', 'reported'] as const).map(s => (
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
      </div>

      {/* Rating filter pills */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {ratingFilters.map(f => (
          <button
            key={f.value}
            onClick={() => setRatingFilter(f.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors ${ratingFilter === f.value ? 'bg-amber-400 text-white border-amber-400' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Review cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 h-28 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div
              key={review.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${review.status !== 'visible' ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <StarDisplay rating={review.ratingGeneral} size="sm" showValue />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusConfig[review.status].className}`}>
                      {statusConfig[review.status].label}
                    </span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}

                  {/* Criteria mini row */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {[
                      { label: 'Cumplimiento', value: review.ratingFulfillment },
                      { label: 'Entrega', value: review.ratingDelivery },
                      { label: 'Mercadería', value: review.ratingProductCondition },
                      { label: 'Atención', value: review.ratingCommunication },
                    ].map(c => (
                      <span key={c.label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.value >= 4 ? 'bg-green-50 text-green-700' : c.value === 3 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                        {c.label} {c.value}/5
                      </span>
                    ))}
                  </div>

                  {/* Meta */}
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

                {/* Action */}
                <button
                  onClick={() => toggleVisibility(review.id, review.status === 'visible')}
                  title={review.status === 'visible' ? 'Ocultar reseña' : 'Publicar reseña'}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${review.status === 'visible' ? 'text-gray-400 hover:bg-red-50 hover:text-red-500' : 'text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                >
                  {review.status === 'visible' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
              {loading ? 'Cargando...' : 'Sin reseñas con estos filtros'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
