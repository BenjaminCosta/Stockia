'use client'

import { useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Country list ──────────────────────────────────────────────────────────────

export interface Country {
  code: string
  flag: string
  name: string
  dial: string
}

const COUNTRIES: Country[] = [
  { code: 'AR', flag: '🇦🇷', name: 'Argentina',  dial: '+54'  },
  { code: 'BR', flag: '🇧🇷', name: 'Brasil',      dial: '+55'  },
  { code: 'CL', flag: '🇨🇱', name: 'Chile',       dial: '+56'  },
  { code: 'UY', flag: '🇺🇾', name: 'Uruguay',     dial: '+598' },
  { code: 'PY', flag: '🇵🇾', name: 'Paraguay',    dial: '+595' },
  { code: 'BO', flag: '🇧🇴', name: 'Bolivia',     dial: '+591' },
  { code: 'CO', flag: '🇨🇴', name: 'Colombia',    dial: '+57'  },
  { code: 'MX', flag: '🇲🇽', name: 'México',      dial: '+52'  },
  { code: 'ES', flag: '🇪🇸', name: 'España',      dial: '+34'  },
  { code: 'US', flag: '🇺🇸', name: 'EEUU',        dial: '+1'   },
]

const DEFAULT_COUNTRY = COUNTRIES[0] // Argentina

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Keep only digits, spaces, hyphens and parentheses in the local part */
function sanitizeLocal(raw: string): string {
  return raw.replace(/[^0-9\s\-()]/g, '')
}

// ─── Component ─────────────────────────────────────────────────────────────────

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
  required?: boolean
}

/**
 * Splits value back into country + local part for display.
 * value is always stored as "<dial> <local>", e.g. "+54 11 1234-5678"
 */
function parseValue(value: string, countries: Country[]): { country: Country; local: string } {
  for (const c of countries) {
    if (value.startsWith(c.dial + ' ')) {
      return { country: c, local: value.slice(c.dial.length + 1) }
    }
  }
  // Try matching just the dial code without trailing space
  for (const c of countries) {
    if (value === c.dial) {
      return { country: c, local: '' }
    }
  }
  return { country: DEFAULT_COUNTRY, local: value }
}

export function PhoneInput({ value, onChange, className, required }: PhoneInputProps) {
  const { country: initialCountry, local: initialLocal } = parseValue(value, COUNTRIES)
  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry)
  const [localValue, setLocalValue] = useState(initialLocal)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const emit = (country: Country, local: string) => {
    const full = local.trim() ? `${country.dial} ${local}` : country.dial
    onChange(full)
  }

  const handleCountrySelect = (c: Country) => {
    setSelectedCountry(c)
    setOpen(false)
    emit(c, localValue)
  }

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeLocal(e.target.value)
    setLocalValue(sanitized)
    emit(selectedCountry, sanitized)
  }

  return (
    <div className={cn('relative flex h-12 items-stretch overflow-visible rounded-xl border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-shadow', className)}>
      {/* Country trigger */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="flex shrink-0 items-center gap-1.5 rounded-l-xl border-r border-input bg-muted/50 px-3 text-sm font-medium text-foreground hover:bg-muted transition-colors focus:outline-none"
        aria-label="Seleccionar país"
        aria-expanded={open}
      >
        <span className="text-base leading-none">{selectedCountry.flag}</span>
        <span className="text-xs font-semibold text-muted-foreground tabular-nums">{selectedCountry.dial}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {/* Local number input */}
      <input
        type="tel"
        inputMode="tel"
        value={localValue}
        onChange={handleLocalChange}
        placeholder="11 1234-5678"
        required={required}
        className="min-w-0 flex-1 rounded-r-xl bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        aria-label="Número de teléfono"
      />

      {/* Dropdown */}
      {open && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-[calc(100%+6px)] z-50 min-w-56 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_16px_40px_rgba(11,26,69,0.14)]"
        >
          {COUNTRIES.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleCountrySelect(c)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
            >
              <span className="text-base">{c.flag}</span>
              <span className="flex-1 text-left font-medium text-foreground">{c.name}</span>
              <span className="tabular-nums text-muted-foreground">{c.dial}</span>
              {c.code === selectedCountry.code && (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
