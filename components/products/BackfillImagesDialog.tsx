'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Sparkles, X, ArrowRight, CheckSquare, Square, Loader2, ImageOff } from 'lucide-react'
import type { Product } from '@/lib/types'
import {
  matchExistingProducts,
  type ExistingProductMatchResult,
  type MatchConfidence,
} from '@/lib/import/productMatcher'
import { backfillProductImages } from '@/lib/data/products.service'

interface BackfillImagesDialogProps {
  products: Product[]
  onClose: () => void
  onSuccess: (count: number) => void
}

type Phase = 'loading' | 'preview' | 'saving' | 'done'

interface MatchItem extends ExistingProductMatchResult {
  selected: boolean
}

const CONFIDENCE_LABEL: Record<MatchConfidence, string> = {
  strong: 'Alta',
  medium: 'Media',
  weak:   'Baja',
}

const CONFIDENCE_STYLE: Record<MatchConfidence, string> = {
  strong: 'bg-[#F1FFD1] text-[#4A662E]',
  medium: 'bg-amber-50 text-amber-700',
  weak:   'bg-[#F7F8FA] text-[#7A839C]',
}

export function BackfillImagesDialog({ products, onClose, onSuccess }: BackfillImagesDialogProps) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [matches, setMatches] = useState<MatchItem[]>([])
  const [saveResult, setSaveResult] = useState<{ ok: number; failed: number } | null>(null)

  useEffect(() => {
    matchExistingProducts(products).then(results => {
      setMatches(
        results.map(r => ({
          ...r,
          selected: r.confidence !== 'weak',
        }))
      )
      setPhase('preview')
    })
  }, [products])

  const selectedCount = matches.filter(m => m.selected).length
  const allSelected = matches.length > 0 && matches.every(m => m.selected)

  const toggleAll = () => {
    setMatches(ms => ms.map(m => ({ ...m, selected: !allSelected })))
  }

  const toggle = (productId: string) => {
    setMatches(ms => ms.map(m => m.product.id === productId ? { ...m, selected: !m.selected } : m))
  }

  const handleConfirm = async () => {
    const toUpdate = matches.filter(m => m.selected)
    if (toUpdate.length === 0) return
    setPhase('saving')
    const result = await backfillProductImages(
      toUpdate.map(m => ({
        productId: m.product.id,
        imageUrl: m.masterProduct.imageUrl,
        masterProductId: m.masterProduct.id,
      }))
    )
    setSaveResult(result)
    setPhase('done')
    if (result.ok > 0) onSuccess(result.ok)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#0B1A45]/40 backdrop-blur-sm" onClick={phase === 'saving' ? undefined : onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-[0_20px_60px_rgba(11,26,69,0.25)] flex flex-col max-h-[90dvh]">

        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 md:hidden">
          <div className="w-10 h-1 rounded-full bg-[#DFE1E8]" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-4 pb-0">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-0.5">Catálogo maestro</p>
            <h2 className="font-heading font-bold text-lg text-[#0B1A45] leading-tight">Buscar imágenes automáticamente</h2>
          </div>
          <button
            onClick={phase === 'saving' ? undefined : onClose}
            disabled={phase === 'saving'}
            className="h-8 w-8 rounded-xl bg-[#F7F8FA] border border-[#DFE1E8]/80 flex items-center justify-center text-[#5F6880] hover:bg-[#EFF0F3] transition-colors shrink-0 mt-0.5 disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">

          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Loader2 className="h-8 w-8 text-[#0B1A45] animate-spin" />
              <p className="text-sm font-semibold text-[#5F6880]">
                Analizando {products.length} {products.length === 1 ? 'producto' : 'productos'}...
              </p>
              <p className="text-xs text-[#7A839C]">Comparando contra el catálogo maestro</p>
            </div>
          )}

          {phase === 'preview' && matches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-[#F7F8FA] flex items-center justify-center">
                <ImageOff className="h-7 w-7 text-[#DFE1E8]" />
              </div>
              <div>
                <p className="font-bold text-sm text-[#0B1A45]">Sin coincidencias</p>
                <p className="text-xs text-[#7A839C] mt-1 max-w-56 mx-auto leading-snug">
                  No encontramos productos del catálogo maestro que coincidan con tu inventario.
                </p>
              </div>
            </div>
          )}

          {phase === 'preview' && matches.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-[#0B1A45]">
                    {matches.length} {matches.length === 1 ? 'coincidencia encontrada' : 'coincidencias encontradas'}
                  </p>
                  <p className="text-xs text-[#7A839C] mt-0.5">Seleccioná las que querés actualizar</p>
                </div>
                <button
                  onClick={toggleAll}
                  className="text-xs font-semibold text-[#5F6880] hover:text-[#0B1A45] transition-colors shrink-0"
                >
                  {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
              </div>

              <div className="space-y-2">
                {matches.map(m => (
                  <button
                    key={m.product.id}
                    onClick={() => toggle(m.product.id)}
                    className={`w-full flex items-center gap-2 p-3 rounded-xl border text-left transition-colors ${
                      m.selected
                        ? 'bg-[#F7FAFF] border-[#0B1A45]/20'
                        : 'bg-white border-[#DFE1E8]/80 hover:border-[#DFE1E8]'
                    }`}
                  >
                    {/* Checkbox */}
                    <div className="shrink-0">
                      {m.selected
                        ? <CheckSquare className="h-4 w-4 text-[#0B1A45]" />
                        : <Square className="h-4 w-4 text-[#7A839C]" />
                      }
                    </div>

                    {/* Current product (no image) */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#F7F8FA] border border-dashed border-[#DFE1E8] flex items-center justify-center shrink-0">
                        <ImageOff className="h-3 w-3 text-[#DFE1E8]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B1A45] truncate">{m.product.name}</p>
                        <p className="text-[10px] text-[#7A839C] truncate">{m.product.category}</p>
                      </div>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="h-3.5 w-3.5 text-[#7A839C] shrink-0" />

                    {/* Matched master product */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Image
                        src={m.masterProduct.imageUrl}
                        alt=""
                        width={36}
                        height={36}
                        className="w-9 h-9 rounded-lg object-contain bg-white border border-[#DFE1E8]/60 shrink-0"
                        unoptimized
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B1A45] truncate">{m.masterProduct.name}</p>
                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full ${CONFIDENCE_STYLE[m.confidence]}`}>
                          {CONFIDENCE_LABEL[m.confidence]}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {phase === 'saving' && (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <Loader2 className="h-8 w-8 text-[#0B1A45] animate-spin" />
              <p className="text-sm font-semibold text-[#5F6880]">Actualizando imágenes...</p>
            </div>
          )}

          {phase === 'done' && saveResult && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="h-14 w-14 rounded-2xl bg-[#F1FFD1] flex items-center justify-center">
                <Sparkles className="h-7 w-7 text-[#4A662E]" />
              </div>
              <div>
                <p className="font-bold text-base text-[#0B1A45]">
                  {saveResult.ok} {saveResult.ok === 1 ? 'imagen actualizada' : 'imágenes actualizadas'}
                </p>
                {saveResult.failed > 0 && (
                  <p className="text-xs text-[#7A839C] mt-1">{saveResult.failed} no {saveResult.failed === 1 ? 'pudo' : 'pudieron'} actualizarse</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(phase === 'preview' || phase === 'done') && (
          <div className="px-5 pb-5 pt-3 border-t border-[#DFE1E8]/60 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-[#DFE1E8]/80 bg-[#F7F8FA] text-sm font-semibold text-[#5F6880] hover:bg-[#EFF0F3] transition-colors"
            >
              {phase === 'done' ? 'Cerrar' : 'Cancelar'}
            </button>
            {phase === 'preview' && matches.length > 0 && (
              <button
                onClick={handleConfirm}
                disabled={selectedCount === 0}
                className="flex-1 h-11 rounded-xl bg-[#0B1A45] hover:bg-[#14265f] text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                Confirmar {selectedCount > 0 && `${selectedCount} `}{selectedCount === 1 ? 'actualización' : 'actualizaciones'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
