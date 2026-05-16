'use client'

import Link from 'next/link'
import { Package, Check, Minus, Plus, ShoppingCart, TrendingUp, Tag, MapPin } from 'lucide-react'
import { categories, formatCurrency } from '@/lib/mock-data'
import { Product } from '@/lib/types'
import { cn } from '@/lib/utils'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBestSeller(p: Product) {
  return p.rating >= 4.8 && p.reviewCount >= 100
}

function isOffer(p: Product) {
  return parseInt(p.id.replace(/\D/g, ''), 10) % 4 === 0
}

// ── Stepper ───────────────────────────────────────────────────────────────────

export function Stepper({
  qty,
  onChange,
  disabled,
}: {
  qty: number
  onChange: (v: number) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-center rounded-xl border border-[#DFE1E8] overflow-hidden">
      <button
        onClick={() => onChange(Math.max(1, qty - 1))}
        disabled={qty <= 1 || disabled}
        className="h-8 w-8 flex items-center justify-center text-[#0B1A45] hover:bg-[#F7F8FA] transition disabled:opacity-30 shrink-0"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-bold text-[#0B1A45] tabular-nums">{qty}</span>
      <button
        onClick={() => onChange(qty + 1)}
        disabled={disabled}
        className="h-8 w-8 flex items-center justify-center text-[#0B1A45] hover:bg-[#F7F8FA] transition disabled:opacity-30 shrink-0"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── ProductCard ───────────────────────────────────────────────────────────────

export interface ProductCardProps {
  product: Product
  distName?: string
  distDistance?: string
  qty: number
  onQtyChange: (v: number) => void
  onAdd: () => void
  justAdded: boolean
  view: 'grid' | 'list'
}

export function ProductCard({
  product,
  distName,
  distDistance,
  qty,
  onQtyChange,
  onAdd,
  justAdded,
  view,
}: ProductCardProps) {
  const bestSeller = isBestSeller(product)
  const offer = isOffer(product)
  const outOfStock = product.stock === 0
  const catObj = categories.find(c => c.name === product.category)

  const productImg = (sizeClass: string, rounded = 'rounded-xl') => (
    <div className={cn('flex items-center justify-center bg-white overflow-hidden', rounded, sizeClass)}>
      {catObj ? (
        <img src={catObj.image} alt={product.category} className="h-2/3 w-2/3 object-contain" />
      ) : (
        <Package className="h-8 w-8 text-gray-200" />
      )}
    </div>
  )

  /* ── Mobile / list card ───────────────────────────────────────────────── */
  if (view === 'list') {
    return (
      <div
        className={cn(
          'bg-white rounded-2xl border border-[#DFE1E8] p-3 flex items-center gap-3 transition-all',
          justAdded && 'ring-2 ring-[#C8FF00]/60',
        )}
      >
        <Link href={`/comercio/producto/${product.id}`} className="shrink-0">
          {productImg('h-16 w-16')}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <Link href={`/comercio/producto/${product.id}`} className="flex-1">
              <h3 className="font-semibold text-sm text-[#0B1A45] leading-tight line-clamp-1 hover:underline">
                {product.name}
              </h3>
            </Link>
            {bestSeller && (
              <span className="shrink-0 flex items-center gap-0.5 bg-[#F1FFD1] text-[#4A662E] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                <TrendingUp className="h-2.5 w-2.5" /> Top
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#7A839C] mb-1.5">
            {product.category}
            {distName ? ` · ${distName}` : ''}
          </p>
          <span className="font-bold text-base text-[#0B1A45]">{formatCurrency(product.price)}</span>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <Stepper qty={qty} onChange={onQtyChange} disabled={outOfStock} />
          <button
            onClick={onAdd}
            disabled={outOfStock}
            className={cn(
              'h-8 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap',
              justAdded
                ? 'bg-[rgba(137,179,23,0.15)] text-[#4A662E]'
                : 'bg-[#0B1A45] text-white hover:bg-[#0B1A45]/90 active:scale-[0.97]',
              outOfStock && 'opacity-40 cursor-not-allowed bg-gray-100 text-gray-400',
            )}
          >
            {justAdded ? (
              <>
                <Check className="h-3 w-3" /> Agregado
              </>
            ) : (
              'Agregar'
            )}
          </button>
        </div>
      </div>
    )
  }

  /* ── Desktop / grid card ──────────────────────────────────────────────── */
  return (
    <div
      className={cn(
        'bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-200 shadow-[0_2px_12px_rgba(11,26,69,0.06)] hover:shadow-[0_8px_24px_rgba(11,26,69,0.10)] hover:-translate-y-0.5',
        justAdded && 'ring-2 ring-[#C8FF00]/60',
      )}
    >
      <Link href={`/comercio/producto/${product.id}`} className="relative block">
        {(bestSeller || offer) && (
          <div className="absolute top-2 left-2 z-10 flex gap-1 flex-wrap">
            {bestSeller && (
              <span className="flex items-center gap-0.5 bg-[#F1FFD1] text-[#4A662E] text-[9px] font-bold px-2 py-1 rounded-full">
                <TrendingUp className="h-2.5 w-2.5" /> Más vendido
              </span>
            )}
            {offer && (
              <span className="flex items-center gap-0.5 bg-[#F1FFD1]/80 text-[#0B1A45] text-[9px] font-bold px-2 py-1 rounded-full border border-[#C8FF00]/40">
                <Tag className="h-2.5 w-2.5" /> Oferta
              </span>
            )}
          </div>
        )}
        {productImg('aspect-square w-full', 'rounded-none')}
      </Link>

      {/* Separator */}
      <div className="h-px mx-3 bg-linear-to-r from-transparent via-gray-200 to-transparent shadow-[0_1px_6px_rgba(11,26,69,0.07)]" />

      <div className="flex flex-col flex-1 p-2.5 pt-2 md:p-4 md:pt-3">
        <Link href={`/comercio/producto/${product.id}`}>
          <h3 className="font-bold text-xs md:text-sm text-[#0B1A45] leading-snug line-clamp-2 mb-0.5 hover:underline">
            {product.name}
          </h3>
        </Link>
        <p className="text-[10px] md:text-[11px] text-[#7A839C] mb-1.5 md:mb-3 flex items-center gap-1 flex-wrap">
          {product.category}
          {distDistance && (
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />
              {distDistance}
            </span>
          )}
        </p>

        <div className="mb-2 md:mb-4">
          <span className="font-bold text-base md:text-xl text-[#0B1A45]">{formatCurrency(product.price)}</span>
        </div>

        <div className="mt-auto flex items-center gap-2">
          {/* Mobile: compact + button */}
          <button
            onClick={onAdd}
            disabled={outOfStock}
            className={cn(
              'md:hidden ml-auto h-8 w-8 rounded-xl flex items-center justify-center transition-all shrink-0',
              justAdded
                ? 'bg-[rgba(137,179,23,0.15)] text-[#4A662E]'
                : 'bg-[#F7F8FA] text-[#0B1A45] active:scale-[0.95]',
              outOfStock && 'opacity-40 cursor-not-allowed',
            )}
          >
            {justAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
          {/* Desktop: stepper + full Agregar button */}
          <div className="hidden md:flex items-center gap-2 w-full">
            <Stepper qty={qty} onChange={onQtyChange} disabled={outOfStock} />
            <button
              onClick={onAdd}
              disabled={outOfStock}
              className={cn(
                'flex-1 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                justAdded
                  ? 'bg-[rgba(137,179,23,0.15)] text-[#4A662E]'
                  : 'bg-[#0B1A45] text-white hover:bg-[#0B1A45]/90 active:scale-[0.98]',
                outOfStock && 'bg-gray-100 text-gray-400 cursor-not-allowed',
              )}
            >
              {justAdded ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Agregado
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" /> Agregar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
