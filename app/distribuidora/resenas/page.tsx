'use client'

import { useEffect, useState } from 'react'
import { Star, TrendingUp, MessageSquare, Users } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Distribuidora, Review, CommerceHistory } from '@/lib/types'
import { getReviewsByDistributor, getDistributorRatingSummary, getCommerceHistoriesByDistributor } from '@/lib/data/reviews.service'
import { StarDisplay, CriteriaRow } from '@/components/star-rating'
import { ReviewCard } from '@/components/review-card'

const tabs = ['Reseñas', 'Historial de comercios'] as const
type Tab = typeof tabs[number]

function ScorePill({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-3.5 text-center">
      <span className="font-heading font-bold text-xl text-gray-900">{value.toFixed(1)}</span>
      <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mt-0.5 leading-tight">{label}</span>
    </div>
  )
}

function getRiskLabel(history: CommerceHistory): { label: string; className: string } {
  const issues = history.cancelledOrders + history.notDeliveredOrders + history.reportedIssues
  if (issues === 0 && history.completedOrders >= 5) return { label: 'Cliente confiable', className: 'bg-emerald-50 text-emerald-700' }
  if (issues <= 1) return { label: 'Buen historial', className: 'bg-green-50 text-green-700' }
  if (issues <= 3) return { label: 'Historial regular', className: 'bg-amber-50 text-amber-700' }
  return { label: 'Requiere atención', className: 'bg-red-50 text-red-600' }
}

function formatRelativeDate(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'hoy'
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days} días`
  const months = Math.floor(days / 30)
  if (months < 12) return `hace ${months} mes${months > 1 ? 'es' : ''}`
  return `hace ${Math.floor(months / 12)} año${Math.floor(months / 12) > 1 ? 's' : ''}`
}

export default function ResenasDistribuidoraPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const distId = distribuidora?.id || 'dist-1'

  const [activeTab, setActiveTab] = useState<Tab>('Reseñas')
  const [reviews, setReviews] = useState<Review[]>([])
  const [summary, setSummary] = useState<{ averageGeneral: number; averageFulfillment: number; averageDelivery: number; averageProductCondition: number; averageCommunication: number; reviewCount: number } | null>(null)
  const [histories, setHistories] = useState<CommerceHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getReviewsByDistributor(distId),
      getDistributorRatingSummary(distId),
      getCommerceHistoriesByDistributor(distId),
    ]).then(([rev, sum, hist]) => {
      setReviews(rev)
      setSummary(sum)
      setHistories(hist)
      setLoading(false)
    })
  }, [distId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-[#C8FF00] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-24 lg:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-3 md:pt-6 pb-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-3 md:mb-6">Reseñas</h1>
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-semibold rounded-t-xl border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-[#C8FF00] text-[#0B1A45]'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 md:px-8 py-4 md:py-6 max-w-4xl mx-auto w-full">
        {activeTab === 'Reseñas' && (
          <div className="space-y-4">
            {/* Summary card */}
            {summary && summary.reviewCount > 0 ? (
              <>
                <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm p-5">
                  <div className="flex items-center gap-5 mb-5">
                    {/* Big score */}
                    <div className="text-center shrink-0">
                      <p className="font-heading font-bold text-5xl text-gray-900 leading-none">
                        {summary.averageGeneral.toFixed(1)}
                      </p>
                      <StarDisplay rating={summary.averageGeneral} size="md" className="mt-2 justify-center" />
                      <p className="text-xs text-gray-400 mt-1.5">
                        {summary.reviewCount} reseña{summary.reviewCount !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Criteria bars */}
                    <div className="flex-1 space-y-2.5">
                      <CriteriaRow label="Cumplimiento" value={summary.averageFulfillment} />
                      <CriteriaRow label="Entrega" value={summary.averageDelivery} />
                      <CriteriaRow label="Mercadería" value={summary.averageProductCondition} />
                      <CriteriaRow label="Atención" value={summary.averageCommunication} />
                    </div>
                  </div>

                  {/* Mini score pills */}
                  <div className="grid grid-cols-4 gap-2">
                    <ScorePill label="Cumplimiento" value={summary.averageFulfillment} />
                    <ScorePill label="Entrega" value={summary.averageDelivery} />
                    <ScorePill label="Mercadería" value={summary.averageProductCondition} />
                    <ScorePill label="Atención" value={summary.averageCommunication} />
                  </div>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                    <p className="font-heading font-bold text-2xl text-gray-900">{reviews.filter(r => r.ratingGeneral >= 4).length}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Positivas</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                    <p className="font-heading font-bold text-2xl text-gray-900">{reviews.filter(r => r.comment).length}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Con comentario</p>
                  </div>
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
                    <p className={`font-heading font-bold text-2xl ${reviews.filter(r => r.ratingGeneral <= 2).length > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                      {reviews.filter(r => r.ratingGeneral <= 2).length}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Negativas</p>
                  </div>
                </div>

                {/* Reviews list */}
                <div className="space-y-3">
                  {reviews.map(review => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                  <Star className="h-8 w-8 text-amber-300" />
                </div>
                <p className="font-semibold text-gray-700 text-lg">Aún sin reseñas</p>
                <p className="text-gray-400 text-sm mt-1 max-w-xs">
                  Las reseñas aparecerán aquí cuando los comercios califiquen sus pedidos entregados.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Historial de comercios' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-400 mb-4">
              Historial operativo de tus clientes. Información interna para evaluar pedidos.
            </p>
            {histories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users className="h-10 w-10 text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm">No hay historial disponible aún.</p>
              </div>
            ) : (
              histories.map(h => {
                const risk = getRiskLabel(h)
                const joined = new Date(h.joinedAt).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })
                return (
                  <div key={h.commerceId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{h.commerceName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">En Stockia desde {joined} · Último pedido {formatRelativeDate(h.lastOrderAt)}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${risk.className}`}>
                        {risk.label}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <p className="font-heading font-bold text-lg text-emerald-600">{h.completedOrders}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Completados</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-heading font-bold text-lg ${h.cancelledOrders > 0 ? 'text-amber-500' : 'text-gray-300'}`}>{h.cancelledOrders}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Cancelados</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-heading font-bold text-lg ${h.notDeliveredOrders > 0 ? 'text-orange-500' : 'text-gray-300'}`}>{h.notDeliveredOrders}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">No entregados</p>
                      </div>
                      <div className="text-center">
                        <p className={`font-heading font-bold text-lg ${h.reportedIssues > 0 ? 'text-red-500' : 'text-gray-300'}`}>{h.reportedIssues}</p>
                        <p className="text-[10px] text-gray-400 leading-tight">Problemas</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </main>
    </div>
  )
}
