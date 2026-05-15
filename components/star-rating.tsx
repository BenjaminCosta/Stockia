'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Display-only star rating ─────────────────────────────────────────────────

interface StarDisplayProps {
  rating: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

const sizeMap = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

export function StarDisplay({ rating, max = 5, size = 'md', showValue = false, className }: StarDisplayProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating)
        const partial = !filled && i < rating
        return (
          <span key={i} className="relative inline-flex">
            <Star className={cn(sizeMap[size], 'text-gray-200 fill-gray-200')} />
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? '100%' : `${(rating % 1) * 100}%` }}
              >
                <Star className={cn(sizeMap[size], 'text-amber-400 fill-amber-400 shrink-0')} />
              </span>
            )}
          </span>
        )
      })}
      {showValue && (
        <span className="ml-1 text-sm font-semibold text-gray-700 tabular-nums">{rating.toFixed(1)}</span>
      )}
    </div>
  )
}

// ─── Interactive star picker ───────────────────────────────────────────────────

interface StarPickerProps {
  value: number
  onChange: (value: number) => void
  size?: 'md' | 'lg'
  className?: string
}

export function StarPicker({ value, onChange, size = 'lg', className }: StarPickerProps) {
  const starSize = size === 'lg' ? 'h-8 w-8' : 'h-6 w-6'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform active:scale-90"
        >
          <Star
            className={cn(
              starSize,
              'transition-colors',
              star <= value ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
            )}
          />
        </button>
      ))}
    </div>
  )
}

// ─── Compact rating badge (for cards) ────────────────────────────────────────

interface RatingBadgeProps {
  rating: number
  reviewCount?: number
  className?: string
}

export function RatingBadge({ rating, reviewCount, className }: RatingBadgeProps) {
  if (!rating) return null
  return (
    <span className={cn('flex items-center gap-1 font-semibold text-amber-600', className)}>
      <Star className="h-3.5 w-3.5 fill-current" />
      <span>{rating.toFixed(1)}</span>
      {reviewCount !== undefined && (
        <span className="text-gray-400 font-normal">({reviewCount})</span>
      )}
    </span>
  )
}

// ─── Criteria breakdown row ───────────────────────────────────────────────────

interface CriteriaRowProps {
  label: string
  value: number
  className?: string
}

export function CriteriaRow({ label, value, className }: CriteriaRowProps) {
  const pct = (value / 5) * 100
  return (
    <div className={cn('flex items-center gap-3 text-sm', className)}>
      <span className="text-gray-500 w-36 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-700 font-semibold tabular-nums w-6 text-right">{value.toFixed(1)}</span>
    </div>
  )
}
