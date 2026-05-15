'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { useOrder } from '@/hooks/use-data'
import { createReview, getReviewByOrder } from '@/lib/data/reviews.service'
import { StarPicker } from '@/components/star-rating'
import { Comercio } from '@/lib/types'

const criteria: { key: 'ratingFulfillment' | 'ratingDelivery' | 'ratingProductCondition' | 'ratingCommunication'; label: string; description: string }[] = [
  { key: 'ratingFulfillment', label: 'Cumplimiento del pedido', description: '¿Llegaron todos los productos pedidos?' },
  { key: 'ratingDelivery', label: 'Tiempo de entrega', description: '¿Cumplieron con el tiempo prometido?' },
  { key: 'ratingProductCondition', label: 'Estado de la mercadería', description: '¿Los productos llegaron en buen estado?' },
  { key: 'ratingCommunication', label: 'Atención y comunicación', description: '¿Te informaron bien ante cualquier inconveniente?' },
]

function CalificarForm({ orderId }: { orderId: string }) {
  const router = useRouter()
  const { currentUser } = useApp()
  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const { data: order, loading } = useOrder(orderId)

  const [alreadyReviewed, setAlreadyReviewed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [ratingGeneral, setRatingGeneral] = useState(0)
  const [ratings, setRatings] = useState({
    ratingFulfillment: 0,
    ratingDelivery: 0,
    ratingProductCondition: 0,
    ratingCommunication: 0,
  })
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (orderId) {
      getReviewByOrder(orderId).then(r => { if (r) setAlreadyReviewed(true) })
    }
  }, [orderId])

  const allRated = ratingGeneral > 0 && Object.values(ratings).every(v => v > 0)

  const handleSubmit = async () => {
    if (!allRated || !order || !comercio) return
    setSubmitting(true)
    try {
      await createReview({
        orderId,
        orderNumber: order.orderNumber,
        distributorId: order.distribuidoraId,
        distributorName: order.distribuidoraName,
        commerceId: comercio.id,
        commerceName: comercio.storeName,
        ratingGeneral,
        ...ratings,
        comment: comment.trim(),
      })
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!order || order.status !== 'entregado') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <p className="text-gray-500 mb-4">Solo podés calificar pedidos entregados.</p>
        <Link href="/comercio/pedidos" className="text-primary font-semibold">Volver a mis pedidos</Link>
      </div>
    )
  }

  if (alreadyReviewed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <CheckCircle2 className="h-14 w-14 text-emerald-500 mb-4" />
        <h2 className="font-heading font-bold text-xl text-gray-900 mb-2">Ya calificaste este pedido</h2>
        <p className="text-gray-400 text-sm mb-6">Tu reseña ya fue enviada para este pedido.</p>
        <Link href="/comercio/pedidos" className="text-primary font-semibold">Volver a mis pedidos</Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="font-heading font-bold text-2xl text-gray-900 mb-2">¡Gracias por tu reseña!</h2>
        <p className="text-gray-400 text-sm mb-8 max-w-xs">Tu opinión ayuda a otros comercios a elegir bien sus distribuidoras.</p>
        <Link
          href="/comercio/pedidos"
          className="px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Volver a mis pedidos
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F5F7]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4 max-w-2xl mx-auto">
          <Link href={`/comercio/pedidos/${orderId}`} className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>
          <h1 className="font-heading font-semibold text-base ml-2 text-gray-900">Calificar distribuidora</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full space-y-4">
        {/* Context card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Calificando</p>
          <p className="font-heading font-bold text-lg text-gray-900">{order.distribuidoraName}</p>
          <p className="text-sm text-gray-400 mt-0.5">Pedido {order.orderNumber}</p>
        </div>

        {/* General rating */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-semibold text-gray-900 mb-1">Calificación general</p>
          <p className="text-sm text-gray-400 mb-4">¿Cómo fue tu experiencia con esta distribuidora?</p>
          <StarPicker value={ratingGeneral} onChange={setRatingGeneral} size="lg" />
          {ratingGeneral > 0 && (
            <p className="text-sm text-amber-600 font-semibold mt-2">
              {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][ratingGeneral]}
            </p>
          )}
        </div>

        {/* Criteria */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {criteria.map(c => (
            <div key={c.key} className="p-5">
              <p className="font-semibold text-gray-900 text-sm mb-0.5">{c.label}</p>
              <p className="text-xs text-gray-400 mb-3">{c.description}</p>
              <StarPicker
                value={ratings[c.key]}
                onChange={v => setRatings(prev => ({ ...prev, [c.key]: v }))}
                size="md"
              />
            </div>
          ))}
        </div>

        {/* Comment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="font-semibold text-gray-900 mb-1">Comentario <span className="text-gray-400 font-normal">(opcional)</span></p>
          <p className="text-sm text-gray-400 mb-3">Contá tu experiencia en detalle para ayudar a otros comercios.</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Ej: El pedido llegó completo y en tiempo. La atención fue muy buena…"
            className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-gray-300"
          />
          <p className="text-xs text-gray-300 text-right mt-1">{comment.length}/500</p>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!allRated || submitting}
          className="w-full h-14 bg-primary text-white rounded-2xl font-heading font-bold text-base shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? 'Enviando…' : 'Enviar reseña'}
        </button>

        {!allRated && (
          <p className="text-center text-xs text-gray-400 pb-4">Completá todas las calificaciones para continuar</p>
        )}
      </main>
    </div>
  )
}

export default function CalificarPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params)
  return <CalificarForm orderId={orderId} />
}
