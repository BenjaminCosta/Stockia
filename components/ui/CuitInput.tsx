'use client'

import { useState } from 'react'
import { Check, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── CUIT validation ──────────────────────────────────────────────────────────

const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]

function validateCuit(digits: string): boolean {
  if (digits.length !== 11) return false
  const nums = digits.split('').map(Number)
  const sum = WEIGHTS.reduce((acc, w, i) => acc + w * nums[i], 0)
  const remainder = sum % 11
  const checkDigit = remainder === 0 ? 0 : 11 - remainder
  // remainder === 1 means invalid prefix/number combination
  if (remainder === 1) return false
  return checkDigit === nums[10]
}

// ─── Mask ─────────────────────────────────────────────────────────────────────

/** Format 11 raw digits as XX-XXXXXXXX-X */
function applyMask(digits: string): string {
  const d = digits.slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 10) return `${d.slice(0, 2)}-${d.slice(2)}`
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`
}

function stripNonDigits(v: string): string {
  return v.replace(/\D/g, '')
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CuitInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

type ValidationState = 'empty' | 'incomplete' | 'valid' | 'invalid'

export function CuitInput({ value, onChange, className, placeholder = '20-12345678-9' }: CuitInputProps) {
  const [touched, setTouched] = useState(false)

  const digits = stripNonDigits(value)
  const displayed = applyMask(digits)

  const validationState: ValidationState = (() => {
    if (digits.length === 0) return 'empty'
    if (digits.length < 11) return 'incomplete'
    return validateCuit(digits) ? 'valid' : 'invalid'
  })()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value
    const newDigits = stripNonDigits(raw).slice(0, 11)
    onChange(applyMask(newDigits))
  }

  const showFeedback = touched && validationState !== 'empty'

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={displayed}
          onChange={handleChange}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          maxLength={13} // XX-XXXXXXXX-X = 13 chars
          className={cn(
            'flex h-12 w-full rounded-xl border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground transition-[box-shadow,border-color] duration-150 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            showFeedback && validationState === 'valid'   && 'border-emerald-500 focus:ring-emerald-500/30',
            showFeedback && validationState === 'invalid' && 'border-destructive focus:ring-destructive/30',
            (!showFeedback || validationState === 'incomplete') && 'border-input',
            className,
          )}
          aria-invalid={showFeedback && validationState === 'invalid'}
          aria-label="CUIT"
        />

        {/* Trailing icon */}
        {showFeedback && validationState === 'valid' && (
          <Check className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
        )}
        {showFeedback && validationState === 'invalid' && (
          <AlertCircle className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-destructive" />
        )}
      </div>

      {/* Feedback text */}
      {showFeedback && validationState === 'incomplete' && (
        <p className="text-xs font-medium text-muted-foreground">
          Ingresá los 11 dígitos del CUIT
        </p>
      )}
      {showFeedback && validationState === 'valid' && (
        <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <Check className="h-3 w-3" /> CUIT válido
        </p>
      )}
      {showFeedback && validationState === 'invalid' && (
        <p className="flex items-center gap-1 text-xs font-medium text-destructive">
          <AlertCircle className="h-3 w-3" /> CUIT inválido — revisá los dígitos
        </p>
      )}
    </div>
  )
}
