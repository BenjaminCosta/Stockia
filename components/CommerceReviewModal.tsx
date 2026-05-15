'use client'

import { useState } from 'react'
import { X, Star, CheckCircle2, Loader2 } from 'lucide-react'
import { StarPicker } from '@/components/star-rating'
import { createCommerceReview } from '@/lib/data/commerce-reviews.service'
import type { Order } from '@/lib/types'

interface CommerceReviewModalProps {
  order: Order
  distributorId: string
  distributorName: string
  onClose: () => void
  onSubmitted: () => void
}

const CRITERIA = [
  { key: 'ratingPayment',       label: 'Cumplimiento del pago',    sub: '¿El comercio pagó según lo acordado?' },
  { key: 'ratingReception',     label: 'Recepción del pedido',      sub: '¿Estuvo disponible para recibir?' },
  { key: 'ratingCommunication', label: 'Comunicación',              sub: '¿Respondió a tiempo y con claridad?' },
  { key: 'ratingReliability',   label: 'Confiabilidad',             sub: '¿Es un cliente en quien se puede confiar?' },
] as const

type CriteriaKey = typeof CRITERIA[number]['key']

export function CommerceReviewModal({
  order,
  distributorId,
  distributorName,
  onClose,
  onSubmitted,
}: CommerceReviewModalProps) {
  const [ratingGeneral, setRatingGeneral] = useState(0)
  const [criteria, setCriteria] = useState<Record<CriteriaKey, number>>({
    ratingPayment: 0,
    ratingReception: 0,
    ratingCommunication: 0,
    ratingReliability: 0,
  })
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const isValid =
    ratingGeneral > 0 &&
    Object.values(criteria).every(v => v > 0)

  const handleSubmit = async () => {
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      await createCommerceReview({
        orderId: order.id,
        orderNumber: order.orderNumber,
        distributorId,
        distributorName,
        commerceId: order.comercioId,
        commerceName: order.comercioName,
        ratingGeneral,
        ...criteria,
        comment: comment.trim(),
      })
      setDone(true)
      setTimeout(() => {
        onSubmitted() // parent handles close + step 2
      }, 1400)
    } catch (err) {
      console.error('[CommerceReviewModal] createCommerceReview failed', err)
      setSubmitting(false)
    }
  }

  const commerceInitials = order.comercioName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-lg max-h-[92dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#F1FFD1] flex items-center justify-center font-bold text-[#4A662E] text-sm">
              {commerceInitials}
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900 text-base">Calificar comercio</h2>
              <p className="text-xs text-gray-400">{order.comercioName} · {order.orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Done state */}
        {done ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 gap-4">
            <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <p className="font-heading font-bold text-gray-900 text-lg">¡Reseña enviada!</p>
            <p className="text-sm text-gray-400 text-center">Tu calificación ayuda a conocer mejor a tus clientes.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-6">

            {/* General rating */}
            <div className="text-center pt-2">
              <p className="text-sm font-semibold text-gray-700 mb-3">Calificación general</p>
              <StarPicker value={ratingGeneral} onChange={setRatingGeneral} size="lg" className="justify-center" />
              <p className="text-xs text-gray-400 mt-2">
                {ratingGeneral === 0 ? 'Tocá una estrella' :
                 ratingGeneral === 1 ? 'Muy malo' :
                 ratingGeneral === 2 ? 'Malo' :
                 ratingGeneral === 3 ? 'Regular' :
                 ratingGeneral === 4 ? 'Bueno' : 'Excelente'}
              </p>
            </div>

            {/* Criteria */}
            <div className="space-y-4">
              {CRITERIA.map(c => (
                <div key={c.key} className="bg-gray-50 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{c.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
                    </div>
                    {criteria[c.key] > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        criteria[c.key] >= 4 ? 'bg-emerald-50 text-emerald-700' :
                        criteria[c.key] === 3 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {criteria[c.key]}/5
                      </span>
                    )}
                  </div>
                  <StarPicker
                    value={criteria[c.key]}
                    onChange={v => setCriteria(prev => ({ ...prev, [c.key]: v }))}
                    size="md"
                  />
                </div>
              ))}
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">
                Comentario <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="¿Querés agregar algo sobre tu experiencia con este comercio?"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{comment.length}/500</p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="w-full h-13 py-3.5 rounded-xl font-bold text-sm bg-[#0B1A45] text-[#C8FF00] hover:bg-[#0B1A45]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                <><Star className="h-4 w-4 fill-current" /> Enviar calificación</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
