'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Package, Check, Minus, Plus, ShoppingCart, TrendingUp, Tag, MapPin, Heart } from 'lucide-react'
import { categories, formatCurrency } from '@/lib/mock-data'
import { Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/app-context'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBestSeller(p: Product) {
  return p.rating >= 4.8 && p.reviewCount >= 100
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
  const [inputVal, setInputVal] = useState(String(qty))

  // Sync when qty changes from outside (e.g. +/- buttons)
  useEffect(() => {
    setInputVal(String(qty))
  }, [qty])

  const commit = (raw: string) => {
    const n = parseInt(raw, 10)
    if (!isNaN(n) && n >= 1) {
      onChange(n)
      setInputVal(String(n))
    } else {
      setInputVal(String(qty)) // revert to last valid
    }
  }

  return (
    <div className="flex items-center rounded-xl border border-[#DFE1E8] overflow-hidden">
      <button
        onClick={() => onChange(Math.max(1, qty - 1))}
        disabled={qty <= 1 || disabled}
        className="h-8 w-8 flex items-center justify-center text-[#0B1A45] hover:bg-[#F7F8FA] transition disabled:opacity-30 shrink-0"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputVal}
        disabled={disabled}
        onChange={e => setInputVal(e.target.value.replace(/[^0-9]/g, ''))}
        onFocus={e => e.target.select()}
        onBlur={e => commit(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="w-10 text-center text-sm font-bold text-[#0B1A45] tabular-nums bg-transparent border-none outline-none focus:bg-[#F7F8FA] transition-colors disabled:opacity-30"
      />
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
  const offer = product.isOffer === true
  const outOfStock = product.stock === 0
  const catObj = categories.find(c => c.name === product.category)
  const { toggleWishlist, isInWishlist } = useApp()
  const inWishlist = isInWishlist(product.id)
  const [popping, setPopping] = useState(false)

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleWishlist(product)
    setPopping(true)
    setTimeout(() => setPopping(false), 500)
  }

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
          'bg-white rounded-2xl border border-[#DFE1E8] p-3 flex items-center gap-3',
          'transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(11,26,69,0.08)] hover:border-[#DFE1E8]',
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
            <div className="flex items-center gap-1 shrink-0">
              {bestSeller && (
                <span className="flex items-center gap-0.5 bg-[#F1FFD1] text-[#4A662E] text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  <TrendingUp className="h-2.5 w-2.5" /> Top
                </span>
              )}
              <button
                onClick={handleWishlistToggle}
                aria-label={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center transition-colors hover:bg-[#F1FFD1]',
                  popping && 'animate-wishlist-pop'
                )}
              >
                <Heart
                  size={14}
                  className={cn(
                    'transition-colors duration-150',
                    inWishlist ? 'fill-[#C8FF00] stroke-[#C8FF00]' : 'text-[#7A839C]'
                  )}
                />
              </button>
            </div>
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
              'h-8 px-3 rounded-xl text-xs font-bold flex items-center gap-1 whitespace-nowrap',
              'transition-[transform,background-color] duration-150',
              justAdded
                ? 'bg-[rgba(137,179,23,0.15)] text-[#4A662E]'
                : 'bg-[#0B1A45] text-white hover:bg-[#0B1A45]/90 active:scale-[0.97] active:bg-[#0B1A45]',
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
        'bg-white rounded-2xl flex flex-col overflow-hidden',
        'shadow-[0_1px_3px_rgba(11,26,69,0.06),0_4px_12px_rgba(11,26,69,0.05)]',
        'hover:shadow-[0_4px_8px_rgba(11,26,69,0.06),0_12px_28px_rgba(11,26,69,0.10)]',
        'hover:-translate-y-0.5',
        'transition-[transform,box-shadow] duration-200',
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
        {/* Wishlist toggle — grid view */}
        <button
          onClick={handleWishlistToggle}
          aria-label={inWishlist ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          className={cn(
            'absolute top-2 right-2 z-10 h-7 w-7 rounded-full flex items-center justify-center',
            'bg-white/10 backdrop-blur-sm border border-white/20',
            'transition-colors hover:bg-white/20',
            popping && 'animate-wishlist-pop'
          )}
        >
          <Heart
            size={13}
            className={cn(
              'transition-colors duration-150',
              inWishlist ? 'fill-[#C8FF00] stroke-[#C8FF00]' : 'text-[#7A839C]'
            )}
          />
        </button>
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
                'flex-1 h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5',
                'transition-[transform,background-color] duration-150',
                justAdded
                  ? 'bg-[rgba(137,179,23,0.15)] text-[#4A662E]'
                  : 'bg-[#0B1A45] text-white hover:bg-[#0B1A45]/90 active:scale-[0.97] active:bg-[#0B1A45]',
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
