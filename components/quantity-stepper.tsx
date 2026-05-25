'use client'

import { useState, useEffect } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuantityStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  /** 'sm' = compact (sidebars/cards), 'md' = default (detail pages) */
  size?: 'sm' | 'md'
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 999,
  disabled = false,
  size = 'md',
}: QuantityStepperProps) {
  const [inputVal, setInputVal] = useState(String(value))

  useEffect(() => {
    setInputVal(String(value))
  }, [value])

  const commit = (raw: string) => {
    const n = parseInt(raw, 10)
    const clamped = isNaN(n) ? null : Math.min(max, Math.max(min, n))
    if (clamped !== null) {
      onChange(clamped)
      setInputVal(String(clamped))
    } else {
      setInputVal(String(value))
    }
  }

  const isSmall = size === 'sm'

  return (
    <div
      className={cn(
        'inline-flex items-center border border-[#DFE1E8] overflow-hidden bg-white',
        isSmall ? 'rounded-lg' : 'rounded-xl',
      )}
    >
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min || disabled}
        className={cn(
          'flex items-center justify-center text-[#0B1A45] hover:bg-[#F7F8FA] transition disabled:opacity-30 shrink-0',
          isSmall ? 'h-6 w-6' : 'h-9 w-9',
        )}
      >
        <Minus className={isSmall ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} />
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
        className={cn(
          'text-center font-bold text-[#0B1A45] tabular-nums bg-transparent border-none outline-none focus:bg-[#F7F8FA] transition-colors disabled:opacity-30',
          isSmall ? 'w-7 text-xs' : 'w-10 text-sm',
        )}
      />

      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max || disabled}
        className={cn(
          'flex items-center justify-center text-[#0B1A45] hover:bg-[#F7F8FA] transition disabled:opacity-30 shrink-0',
          isSmall ? 'h-6 w-6' : 'h-9 w-9',
        )}
      >
        <Plus className={isSmall ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'} />
      </button>
    </div>
  )
}
