'use client'

import { useState } from 'react'
import { X, CheckCircle2, Loader2, Smile, AlertCircle, Lightbulb, ThumbsUp } from 'lucide-react'
import { StarPicker } from '@/components/star-rating'
import { createFeedback } from '@/lib/data/feedback.service'
import { useApp } from '@/lib/app-context'
import type { Comercio, Distribuidora, PlatformFeedback } from '@/lib/types'

interface FeedbackModalProps {
  onClose: () => void
}

type Category = PlatformFeedback['category']

const CATEGORIES: { key: Category; label: string; icon: React.ElementType; color: string }[] = [
  { key: 'general',  label: 'Experiencia general', icon: Smile,        color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'problema', label: 'Tuve un problema',     icon: AlertCircle,  color: 'bg-red-50 text-red-600 border-red-200' },
  { key: 'mejora',   label: 'Sugerencia de mejora', icon: Lightbulb,    color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'elogio',   label: 'Quiero felicitar',     icon: ThumbsUp,     color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
]

const QUESTIONS: Record<Category, string[]> = {
  general:  ['¿Cómo fue tu experiencia en general?', '¿Qué es lo que más te gustó de Stockia?'],
  problema: ['¿Qué problema tuviste?', '¿En qué parte del flujo ocurrió?'],
  mejora:   ['¿Qué mejorarías?', '¿Cómo lo cambiarías?'],
  elogio:   ['¿Qué funcionó muy bien?', '¿Qué recomendarías a otros usuarios?'],
}

export function FeedbackModal({ onClose }: FeedbackModalProps) {
  const { currentUser } = useApp()
  const [category, setCategory] = useState<Category | null>(null)
  const [rating, setRating] = useState(0)
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const isValid = category !== null && rating > 0 && message.trim().length >= 10

  const getUserName = () => {
    if (!currentUser) return 'Usuario'
    if (currentUser.role === 'comercio') return (currentUser as Comercio).storeName || 'Comercio'
    return (currentUser as Distribuidora).companyName || 'Distribuidora'
  }

  const handleSubmit = async () => {
    if (!isValid || submitting || !currentUser || !category) return
    setSubmitting(true)
    try {
      await createFeedback({
        userId: currentUser.id,
        userRole: currentUser.role as 'comercio' | 'distribuidora',
        userName: getUserName(),
        rating,
        message: message.trim(),
        category,
      })
      setDone(true)
      setTimeout(() => onClose(), 2200)
    } catch (err) {
      console.error('[FeedbackModal] createFeedback failed', err)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-md max-h-[90dvh] flex flex-col">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0 md:hidden">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-4 shrink-0">
          <div>
            <h2 className="font-heading font-bold text-gray-900 text-lg">Feedback a Stockia</h2>
            <p className="text-xs text-gray-400 mt-0.5">Tu opinión nos ayuda a mejorar la plataforma</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 gap-4">
            <div className="h-16 w-16 rounded-full bg-[#F1FFD1] flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-[#4A662E]" />
            </div>
            <p className="font-heading font-bold text-gray-900 text-lg">¡Gracias por tu feedback!</p>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Tu opinión es muy importante para el equipo de Stockia. Lo revisaremos pronto.
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 pb-6 space-y-5">

            {/* Category */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">¿Sobre qué querés contarnos?</p>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => {
                  const Icon = c.icon
                  const isSelected = category === c.key
                  return (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border text-left transition-all text-sm font-medium ${
                        isSelected
                          ? `${c.color} border-current`
                          : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="leading-tight">{c.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Rating */}
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <p className="text-sm font-semibold text-gray-700 mb-3">¿Cómo fue tu experiencia en Stockia?</p>
              <StarPicker value={rating} onChange={setRating} size="lg" className="justify-center" />
              <p className="text-xs text-gray-400 mt-2">
                {rating === 0 ? 'Seleccioná una puntuación' :
                 rating === 1 ? 'Muy mala' :
                 rating === 2 ? 'Mala' :
                 rating === 3 ? 'Regular' :
                 rating === 4 ? 'Buena' : 'Excelente'}
              </p>
            </div>

            {/* Message with contextual hints */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Tu mensaje</label>
              {category && (
                <div className="mb-2 space-y-1">
                  {QUESTIONS[category].map((q, i) => (
                    <p key={i} className="text-xs text-gray-400">· {q}</p>
                  ))}
                </div>
              )}
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="Escribí tu comentario aquí..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-400 text-right mt-1">{message.length}/1000</p>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!isValid || submitting}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-[#0B1A45] text-[#C8FF00] hover:bg-[#0B1A45]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
              ) : (
                'Enviar feedback'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
