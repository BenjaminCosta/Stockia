'use client'

import { useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ARGENTINA_PROVINCES } from '@/lib/locations/argentina'
import {
  findProvinceByNameOrSlug,
  getLocalitiesForProvince,
  isValidLocality,
  isValidProvince,
} from '@/lib/locations/location-utils'
import { normalizeTextSlug } from '@/lib/firebase/geo'

export interface LocationSelectorValue {
  province: string
  city: string
}

interface LocationSelectorProps {
  value: LocationSelectorValue
  onChange: (value: LocationSelectorValue) => void
  address?: string
  onAddressChange?: (value: string) => void
  addressLabel?: string
  compact?: boolean
}

function filterOptions(options: string[], query: string, limit = 8) {
  const normalizedQuery = normalizeTextSlug(query)
  if (!normalizedQuery) return options.slice(0, limit)

  return options
    .filter(option => normalizeTextSlug(option).includes(normalizedQuery))
    .slice(0, limit)
}

function SuggestField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  required,
  invalid,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder: string
  disabled?: boolean
  required?: boolean
  invalid?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const suggestions = useMemo(() => filterOptions(options, value), [options, value])
  const showSuggestions = focused && !disabled && suggestions.length > 0

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}{required ? ' *' : ''}</Label>
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          placeholder={placeholder}
          disabled={disabled}
          className={`h-12 bg-background pl-11 ${invalid ? 'border-destructive focus-visible:ring-destructive/30' : ''}`}
        />
        {showSuggestions && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-56 overflow-auto rounded-xl border border-border bg-white p-1 shadow-lg">
            {suggestions.map(option => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onChange(option)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
      {invalid && (
        <p className="text-xs font-medium text-destructive">
          Seleccioná una opción de la lista.
        </p>
      )}
    </div>
  )
}

export function LocationSelector({
  value,
  onChange,
  address,
  onAddressChange,
  addressLabel = 'Dirección',
  compact = false,
}: LocationSelectorProps) {
  const provinceOptions = ARGENTINA_PROVINCES.map(province => province.name)
  const selectedProvince = findProvinceByNameOrSlug(value.province)
  const localityOptions = getLocalitiesForProvince(selectedProvince?.slug ?? value.province)
  const provinceInvalid = value.province.trim().length > 0 && !isValidProvince(value.province)
  const cityInvalid = value.city.trim().length > 0 && !!selectedProvince && !isValidLocality(selectedProvince.slug, value.city)

  const gridClass = compact ? 'grid gap-4 md:grid-cols-2' : 'grid gap-4'

  return (
    <div className={gridClass}>
      {onAddressChange && (
        <div className={compact ? 'md:col-span-2' : undefined}>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">{addressLabel} *</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={address ?? ''}
                onChange={(event) => onAddressChange(event.target.value)}
                placeholder="Calle y número"
                className="h-12 bg-background pl-11"
              />
            </div>
          </div>
        </div>
      )}

      <SuggestField
        label="Provincia"
        value={value.province}
        onChange={(province) => onChange({ province, city: '' })}
        options={provinceOptions}
        placeholder="Ej: Entre Ríos"
        required
        invalid={provinceInvalid}
      />

      <SuggestField
        label="Localidad / Ciudad"
        value={value.city}
        onChange={(city) => onChange({ ...value, city })}
        options={localityOptions}
        placeholder={selectedProvince ? 'Ej: Paraná' : 'Primero elegí provincia'}
        disabled={!selectedProvince}
        required
        invalid={cityInvalid}
      />
    </div>
  )
}
