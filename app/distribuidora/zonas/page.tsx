'use client'

import { useEffect, useMemo, useState } from 'react'
import { Building2, CheckCircle2, Globe, Info, MapPin, Plus, Save, X } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Distribuidora } from '@/lib/types'
import { updateDocument } from '@/lib/firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { LocationSelector, LocationSelectorValue } from '@/components/location-selector'
import { isValidLocality, isValidProvince, normalizeLocationInput, findProvinceByNameOrSlug } from '@/lib/locations/location-utils'
import { ARGENTINA_PROVINCES } from '@/lib/locations/argentina'
import { normalizeTextSlug } from '@/lib/firebase/geo'

// ─── Types ────────────────────────────────────────────────────────────────────

type CoverageMode = 'specific' | 'province' | 'mixed'
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const DELIVERY_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SavingDots() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot [animation-delay:-160ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot [animation-delay:-80ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot" />
    </span>
  )
}

// Simple province-only suggest field
function ProvinceSuggest({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [focused, setFocused] = useState(false)
  const options = useMemo(() => {
    const q = normalizeTextSlug(value)
    const list = ARGENTINA_PROVINCES.map(p => p.name)
    if (!q) return list.slice(0, 8)
    return list.filter(n => normalizeTextSlug(n).includes(q)).slice(0, 8)
  }, [value])
  const showSuggestions = focused && options.length > 0

  return (
    <div className="relative">
      <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        placeholder="Ej: Entre Ríos"
        className="h-10 w-full rounded-xl border border-[#DFE1E8]/80 bg-[#F7F8FA] pl-9 pr-4 text-sm font-medium text-[#0B1A45] placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20 focus:border-[#0B1A45]/30 transition-colors"
      />
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 max-h-52 overflow-auto rounded-xl border border-border bg-white p-1 shadow-lg">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(opt); setFocused(false) }}
              className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-muted"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Mode tab ─────────────────────────────────────────────────────────────────

const MODES: { id: CoverageMode; label: string; icon: React.ReactNode }[] = [
  { id: 'specific',  label: 'Localidades específicas', icon: <MapPin className="h-4 w-4" /> },
  { id: 'province',  label: 'Provincia completa',       icon: <Building2 className="h-4 w-4" /> },
  { id: 'mixed',     label: 'Mixta',                    icon: <Globe className="h-4 w-4" /> },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZonasPage() {
  const { currentUser, refreshCurrentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null

  // ── Derive initial state from existing Firestore data ──────────────────────

  const baseCity     = distribuidora?.location?.city ?? ''
  const baseProvince = distribuidora?.location?.province ?? ''
  const baseAddress  = distribuidora?.address ?? ''

  const existingCoverage = distribuidora?.coverage

  // Resolve initial coverage mode
  const initialMode: CoverageMode = existingCoverage?.mode ?? 'specific'

  // Resolve initial province slugs → display names
  const initialProvinces: string[] = existingCoverage?.provinces ?? []
  const initialProvinceLabels = initialProvinces.reduce<Record<string, string>>((acc, slug) => {
    const found = ARGENTINA_PROVINCES.find(p => p.slug === slug)
    acc[slug] = found?.name ?? slug
    return acc
  }, {})

  // Resolve initial locationKeys (from coverage or legacy)
  const legacyBaseLocationKey = (distribuidora?.location as any)?.zoneKey as string | undefined
  const baseLocationKey = distribuidora?.location?.locationKey || legacyBaseLocationKey || ''

  const initialLocationKeys: string[] = existingCoverage?.locationKeys?.length
    ? existingCoverage.locationKeys
    : distribuidora?.deliveryLocationKeys?.length
      ? distribuidora.deliveryLocationKeys
      : distribuidora?.deliveryZoneKeys?.length
        ? distribuidora.deliveryZoneKeys
        : baseLocationKey
          ? [baseLocationKey]
          : []

  const initialLocationLabels = initialLocationKeys.reduce<Record<string, string>>((acc, key, index) => {
    const existing = distribuidora?.deliveryZones?.[index]
    acc[key] = existing?.includes(':') ? key : (existing ?? key)
    return acc
  }, {})

  // ── Editable state ──────────────────────────────────────────────────────────

  const [coverageMode,     setCoverageMode]     = useState<CoverageMode>(initialMode)
  const [baseLocation,     setBaseLocation]     = useState<LocationSelectorValue>({ province: baseProvince, city: baseCity })
  const [address,          setAddress]          = useState(baseAddress)
  const [locationKeys,     setLocationKeys]     = useState<string[]>(initialLocationKeys)
  const [locationLabels,   setLocationLabels]   = useState<Record<string, string>>(initialLocationLabels)
  const [locationDraft,    setLocationDraft]    = useState<LocationSelectorValue>({ province: '', city: '' })
  const [provinceSlugs,    setProvinceSlugs]    = useState<string[]>(initialProvinces)
  const [provinceLabels,   setProvinceLabels]   = useState<Record<string, string>>(initialProvinceLabels)
  const [provinceDraft,    setProvinceDraft]    = useState('')
  const [minOrder,         setMinOrder]         = useState(String(distribuidora?.minOrder ?? 0))
  const [deliveryTime,     setDeliveryTime]     = useState(String(distribuidora?.deliveryTimeHours ?? 48))
  const [selectedDays,     setSelectedDays]     = useState(['Lunes', 'Miércoles', 'Viernes'])
  const [saveState,        setSaveState]        = useState<SaveState>('idle')

  useEffect(() => {
    if (!distribuidora?.id) return
    setCoverageMode(distribuidora.coverage?.mode ?? 'specific')
    setBaseLocation({ province: baseProvince, city: baseCity })
    setAddress(baseAddress)
    setLocationKeys(initialLocationKeys)
    setLocationLabels(initialLocationLabels)
    setProvinceSlugs(distribuidora.coverage?.provinces ?? [])
    setProvinceLabels(initialProvinceLabels)
    setMinOrder(String(distribuidora.minOrder ?? 0))
    setDeliveryTime(String(distribuidora.deliveryTimeHours ?? 48))
    if (distribuidora.deliveryHours) {
      const days = DELIVERY_DAYS.filter(d => distribuidora.deliveryHours.includes(d))
      if (days.length > 0) setSelectedDays(days)
    }
    setSaveState('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distribuidora?.id])

  // ── Province actions ────────────────────────────────────────────────────────

  const addProvince = () => {
    if (!isValidProvince(provinceDraft)) return
    const found = findProvinceByNameOrSlug(provinceDraft)
    if (!found || provinceSlugs.includes(found.slug)) return
    setProvinceSlugs(prev => [...prev, found.slug])
    setProvinceLabels(prev => ({ ...prev, [found.slug]: found.name }))
    setProvinceDraft('')
  }

  const removeProvince = (slug: string) => {
    setProvinceSlugs(prev => prev.filter(s => s !== slug))
  }

  // ── Locality actions ────────────────────────────────────────────────────────

  const addLocation = () => {
    if (!isValidProvince(locationDraft.province) || !isValidLocality(locationDraft.province, locationDraft.city)) return
    const normalized = normalizeLocationInput(locationDraft)
    if (locationKeys.includes(normalized.locationKey)) return
    setLocationKeys(prev => [...prev, normalized.locationKey])
    setLocationLabels(prev => ({ ...prev, [normalized.locationKey]: `${normalized.city}, ${normalized.province}` }))
    setLocationDraft({ province: '', city: '' })
  }

  const removeLocation = (key: string) => {
    setLocationKeys(prev => prev.filter(k => k !== key))
  }

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  const canSave =
    !!address.trim() &&
    isValidProvince(baseLocation.province) &&
    isValidLocality(baseLocation.province, baseLocation.city)

  const handleSave = async () => {
    if (!distribuidora?.id || !canSave) { setSaveState('error'); return }
    setSaveState('saving')
    try {
      const normalizedBase = normalizeLocationInput(baseLocation)

      // Build coverage object
      const coverage = {
        mode: coverageMode,
        provinces: coverageMode === 'specific' ? [] : provinceSlugs,
        locationKeys: coverageMode === 'province' ? [] : locationKeys,
      }

      // Derive flat deliveryLocationKeys for legacy compat
      const flatLocationKeys = coverageMode === 'province' ? [] : locationKeys

      await updateDocument(COLLECTIONS.distributors, distribuidora.id, {
        address: address.trim(),
        city: normalizedBase.city,
        citySlug: normalizedBase.citySlug,
        province: normalizedBase.province,
        provinceSlug: normalizedBase.provinceSlug,
        locationKey: normalizedBase.locationKey,
        lat: null,
        lng: null,
        location: normalizedBase,
        minimumOrder: Number(minOrder) || 0,
        deliveryTimeHours: Number(deliveryTime) || 48,
        deliveryHours: selectedDays.join(', '),
        deliveryLocationKeys: flatLocationKeys,
        deliveryZoneKeys: flatLocationKeys,
        deliveryZones: flatLocationKeys.map(k => locationLabels[k] ?? k),
        coverage,
      })

      setSaveState('saved')
      window.setTimeout(() => setSaveState('idle'), 2200)
      // Refresh currentUser so el formulario no quede stale al volver a esta página
      refreshCurrentUser().catch(() => {})
    } catch (err) {
      console.error('[zonas] save failed', err)
      setSaveState('error')
    }
  }

  const saveLabel =
    saveState === 'saving' ? 'Guardando cambios'
    : saveState === 'saved' ? 'Cambios guardados'
    : saveState === 'error' ? 'No se pudo guardar'
    : 'Guardar cambios'

  // ── Preview text ────────────────────────────────────────────────────────────

  const previewText = useMemo(() => {
    const parts: string[] = []
    if (coverageMode !== 'specific') {
      parts.push(...provinceSlugs.map(s => provinceLabels[s] ?? s))
    }
    if (coverageMode !== 'province') {
      parts.push(...locationKeys.map(k => locationLabels[k] ?? k))
    }
    return parts.length > 0 ? parts.join(', ') : null
  }, [coverageMode, provinceSlugs, provinceLabels, locationKeys, locationLabels])

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#DFE1E8]/80 px-4 md:px-8 pt-4 md:pt-6 pb-4">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-0.5">Configuración logística</p>
            <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-[#0B1A45]">Zonas de entrega</h1>
            <p className="text-sm text-muted-foreground mt-0.5 hidden md:block">Definí ubicación base, cobertura y condiciones de reparto.</p>
          </div>
          <SaveButton saveState={saveState} canSave={canSave} onSave={handleSave} label={saveLabel} className="hidden sm:inline-flex" />
        </div>
      </header>

      <div className="px-4 md:px-8 pt-6 pb-24 max-w-5xl mx-auto w-full space-y-5">

        {/* ── Ubicación base ── */}
        <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(11,26,69,0.06)] border border-[#DFE1E8]/80 p-6">
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1FFD1] border border-[#C8FF00]/30">
                <MapPin className="h-4.5 w-4.5 text-[#4A662E]" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-[#0B1A45] text-lg">Ubicación base</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Es tu base operativa y dirección principal. Se usa como origen logístico y para geocodificación futura.</p>
              </div>
            </div>
            <SaveButton saveState={saveState} canSave={canSave} onSave={handleSave} label={saveLabel} className="flex sm:hidden mt-2" />
          </div>
          <LocationSelector
            value={baseLocation}
            onChange={setBaseLocation}
            address={address}
            onAddressChange={setAddress}
            compact
          />
        </div>

        {/* ── Cobertura de entrega ── */}
        <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(11,26,69,0.06)] border border-[#DFE1E8]/80 p-6">

          {/* Section header */}
          <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] border border-[#C7D0F0]/60">
                <Globe className="h-4.5 w-4.5 text-[#3D52A0]" />
              </div>
              <div>
                <h2 className="font-heading font-bold text-[#0B1A45] text-lg">Cobertura de entrega</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Elegí en qué zonas querés que tu distribuidora sea visible en Stockia.</p>
              </div>
            </div>
            <div className="flex items-start gap-2 rounded-xl bg-[#EEF4FF] border border-[#C7D0F0]/60 px-3 py-2 text-xs text-[#3D52A0] max-w-xs sm:max-w-[220px]">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>Solo los comercios ubicados en estas zonas podrán encontrar tu distribuidora en Stockia.</span>
            </div>
          </div>

          {/* Mode selector */}
          <div className="mb-5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Modo de cobertura</p>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl border border-[#DFE1E8]/80 bg-[#F7F8FA] p-1">
              {MODES.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setCoverageMode(m.id)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 ${
                    coverageMode === m.id
                      ? 'bg-[#0B1A45] text-white shadow-sm'
                      : 'text-[#5F6880] hover:text-[#0B1A45]'
                  }`}
                >
                  {m.icon}
                  <span className="hidden sm:inline">{m.label}</span>
                  <span className="sm:hidden">{m.id === 'specific' ? 'Localidades' : m.id === 'province' ? 'Provincia' : 'Mixta'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode panels */}
          {coverageMode === 'mixed' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <ProvincePanel
                slugs={provinceSlugs}
                labels={provinceLabels}
                draft={provinceDraft}
                onDraftChange={setProvinceDraft}
                onAdd={addProvince}
                onRemove={removeProvince}
                baseProvince={baseLocation.province}
                onAddBase={() => {
                  const found = findProvinceByNameOrSlug(baseLocation.province)
                  if (found && !provinceSlugs.includes(found.slug)) {
                    setProvinceSlugs(prev => [...prev, found.slug])
                    setProvinceLabels(prev => ({ ...prev, [found.slug]: found.name }))
                  }
                }}
                showBaseSuggestion={!!baseLocation.province && !provinceSlugs.includes(findProvinceByNameOrSlug(baseLocation.province)?.slug ?? '')}
              />
              <LocalityPanel
                locationKeys={locationKeys}
                locationLabels={locationLabels}
                locationDraft={locationDraft}
                onDraftChange={setLocationDraft}
                onAdd={addLocation}
                onRemove={removeLocation}
              />
            </div>
          ) : coverageMode === 'province' ? (
            <ProvincePanel
              slugs={provinceSlugs}
              labels={provinceLabels}
              draft={provinceDraft}
              onDraftChange={setProvinceDraft}
              onAdd={addProvince}
              onRemove={removeProvince}
              baseProvince={baseLocation.province}
              onAddBase={() => {
                const found = findProvinceByNameOrSlug(baseLocation.province)
                if (found && !provinceSlugs.includes(found.slug)) {
                  setProvinceSlugs(prev => [...prev, found.slug])
                  setProvinceLabels(prev => ({ ...prev, [found.slug]: found.name }))
                }
              }}
              showBaseSuggestion={!!baseLocation.province && !provinceSlugs.includes(findProvinceByNameOrSlug(baseLocation.province)?.slug ?? '')}
            />
          ) : (
            <LocalityPanel
              locationKeys={locationKeys}
              locationLabels={locationLabels}
              locationDraft={locationDraft}
              onDraftChange={setLocationDraft}
              onAdd={addLocation}
              onRemove={removeLocation}
            />
          )}
        </div>

        {/* ── Condiciones generales + Vista previa ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white rounded-3xl shadow-[0_10px_30px_rgba(11,26,69,0.06)] border border-[#DFE1E8]/80 p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-1">Logística</p>
            <h2 className="font-heading font-bold text-[#0B1A45] text-lg mb-5">Condiciones generales</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Mínimo de compra ($)</label>
                <input type="number" value={minOrder} onChange={e => setMinOrder(e.target.value)}
                  className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0B1A45] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20 focus:border-[#0B1A45]/30 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">Tiempo estimado de entrega (horas hábiles)</label>
                <input type="number" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)}
                  className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0B1A45] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20 focus:border-[#0B1A45]/30 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-2">Días de reparto</label>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_DAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                        selectedDays.includes(day)
                          ? 'bg-[#0B1A45] text-[#C8FF00] border-[#0B1A45]'
                          : 'bg-[#F7F8FA] text-[#5F6880] border-[#DFE1E8]/80 hover:border-[#0B1A45]/30 hover:text-[#0B1A45]'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
              {/* Delivery time note */}
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5 shrink-0" />
                Los horarios de entrega podrán definirse más adelante.
              </p>
            </div>
          </div>

          {/* Vista previa */}
          <div className="bg-linear-to-r from-sidebar to-sidebar/80 rounded-3xl p-6 flex items-center gap-5 shadow-md">
            <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Vista previa</p>
              {previewText ? (
                <p className="text-white font-semibold text-base leading-snug">
                  Tu distribuidora será visible para comercios en{' '}
                  <span className="font-bold">{previewText}</span>.
                </p>
              ) : (
                <p className="text-white/50 italic text-sm">Sin zonas seleccionadas</p>
              )}
              <p className="text-white/50 text-sm mt-1">
                Base: {[baseLocation.city, baseLocation.province].filter(Boolean).join(', ') || 'ubicación pendiente'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SaveButton({
  saveState,
  canSave,
  onSave,
  label,
  className,
}: {
  saveState: SaveState
  canSave: boolean
  onSave: () => void
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saveState === 'saving' || !canSave}
      className={`h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
        saveState === 'saved'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : saveState === 'error'
            ? 'border-red-200 bg-red-50 text-red-600'
            : 'border-[#0B1A45]/10 bg-[#0B1A45] text-white shadow-sm hover:bg-[#14265f]'
      } ${className ?? ''}`}
    >
      {saveState === 'saving' ? <SavingDots /> : saveState === 'saved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
      {label}
    </button>
  )
}

function ChipTag({
  label,
  onRemove,
  variant = 'green',
}: {
  label: string
  onRemove: () => void
  variant?: 'green' | 'blue'
}) {
  const styles = variant === 'blue'
    ? 'bg-[#EEF2FF] border-[#C7D0F0]/60 text-[#3D52A0]'
    : 'bg-[#F1FFD1] border-[#C8FF00]/30 text-[#4A662E]'
  const iconColor = variant === 'blue' ? 'text-[#3D52A0]' : 'text-[#89B317]'
  const Icon = variant === 'blue' ? Building2 : MapPin

  return (
    <span className={`flex items-center gap-1.5 ${styles} border font-semibold text-sm px-3 py-1.5 rounded-full`}>
      <Icon className={`h-3.5 w-3.5 shrink-0 ${iconColor}`} />
      {label}
      <button type="button" onClick={onRemove} className="ml-0.5 rounded-full hover:text-red-500 transition-colors" aria-label={`Quitar ${label}`}>
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  )
}

function ProvincePanel({
  slugs,
  labels,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
  baseProvince,
  onAddBase,
  showBaseSuggestion,
}: {
  slugs: string[]
  labels: Record<string, string>
  draft: string
  onDraftChange: (v: string) => void
  onAdd: () => void
  onRemove: (slug: string) => void
  baseProvince: string
  onAddBase: () => void
  showBaseSuggestion: boolean
}) {
  return (
    <div>
      <p className="text-xs font-bold text-[#0B1A45] uppercase tracking-wide mb-1">A) Provincias completas</p>
      <p className="text-xs text-muted-foreground mb-3">Tu distribuidora será visible en todas las localidades de estas provincias.</p>

      {slugs.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {slugs.map(slug => (
            <ChipTag key={slug} label={labels[slug] ?? slug} onRemove={() => onRemove(slug)} variant="blue" />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic mb-3">Sin provincias seleccionadas</p>
      )}

      <div className="flex gap-2">
        <ProvinceSuggest value={draft} onChange={onDraftChange} />
        <button
          type="button"
          onClick={onAdd}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#0B1A45] px-3 text-xs font-bold text-white transition-colors hover:bg-[#14265f]"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>

      {showBaseSuggestion && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#DFE1E8]/80 bg-[#F7F8FA] p-3 text-xs text-muted-foreground">
          <span className="text-primary">✦</span>
          <div>
            <span>Sugerencia: Podemos incluir tu base operativa como cobertura automáticamente.</span>
            <button type="button" onClick={onAddBase} className="ml-1 font-bold text-primary hover:underline">
              Agregar {baseProvince}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LocalityPanel({
  locationKeys,
  locationLabels,
  locationDraft,
  onDraftChange,
  onAdd,
  onRemove,
}: {
  locationKeys: string[]
  locationLabels: Record<string, string>
  locationDraft: LocationSelectorValue
  onDraftChange: (v: LocationSelectorValue) => void
  onAdd: () => void
  onRemove: (key: string) => void
}) {
  return (
    <div>
      <p className="text-xs font-bold text-[#0B1A45] uppercase tracking-wide mb-1">B) Localidades específicas</p>
      <p className="text-xs text-muted-foreground mb-3">Perfecto para cubrir zonas puntuales dentro de provincias.</p>

      {locationKeys.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-3">
          {locationKeys.map(key => (
            <ChipTag key={key} label={locationLabels[key] ?? key} onRemove={() => onRemove(key)} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic mb-3">Sin localidades seleccionadas</p>
      )}

      <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
        <LocationSelector value={locationDraft} onChange={onDraftChange} compact />
        <button
          type="button"
          onClick={onAdd}
          className="mt-3 flex items-center gap-2 rounded-xl bg-[#0B1A45] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#14265f]"
        >
          <Plus className="h-4 w-4" />
          Agregar localidad
        </button>
      </div>
    </div>
  )
}
