'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, MapPin, Plus, Save, X } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Distribuidora } from '@/lib/types'
import { updateDocument } from '@/lib/firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { LocationSelector, LocationSelectorValue } from '@/components/location-selector'
import { isValidLocality, isValidProvince, normalizeLocationInput } from '@/lib/locations/location-utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const DELIVERY_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function SavingDots() {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot [animation-delay:-160ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot [animation-delay:-80ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot" />
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZonasPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null

  const baseCity = distribuidora?.location?.city ?? ''
  const baseProvince = distribuidora?.location?.province ?? ''
  const baseAddress = distribuidora?.address ?? ''
  const legacyBaseLocationKey = (distribuidora?.location as any)?.zoneKey as string | undefined
  const baseLocationKey = distribuidora?.location?.locationKey || legacyBaseLocationKey || (
    baseProvince && baseCity ? normalizeLocationInput({ province: baseProvince, city: baseCity }).locationKey : ''
  )

  const initialLocationKeys = distribuidora?.deliveryLocationKeys?.length
    ? distribuidora.deliveryLocationKeys
    : distribuidora?.deliveryZoneKeys?.length
      ? distribuidora.deliveryZoneKeys
    : distribuidora?.deliveryZones?.length
      ? distribuidora.deliveryZones.map(location => location.includes(':')
          ? location
          : normalizeLocationInput({ province: baseProvince || 'Buenos Aires', city: location }).locationKey
        )
      : baseLocationKey
        ? [baseLocationKey]
        : []

  const initialLabels = initialLocationKeys.reduce<Record<string, string>>((acc, key, index) => {
    acc[key] = distribuidora?.deliveryZones?.[index]?.includes(':')
      ? key
      : distribuidora?.deliveryZones?.[index] ?? [baseCity, baseProvince].filter(Boolean).join(', ') ?? key
    return acc
  }, {})

  // ── Editable state ──────────────────────────────────────────────────────────
  const [baseLocation, setBaseLocation] = useState<LocationSelectorValue>({
    province: baseProvince,
    city: baseCity,
  })
  const [address, setAddress] = useState(baseAddress)
  const [locationKeys, setLocationKeys] = useState<string[]>(initialLocationKeys)
  const [locationLabels, setLocationLabels] = useState<Record<string, string>>(initialLabels)
  const [locationDraft, setLocationDraft] = useState<LocationSelectorValue>({ province: '', city: '' })
  const [minOrder, setMinOrder] = useState(String(distribuidora?.minOrder ?? 0))
  const [deliveryTime, setDeliveryTime] = useState(String(distribuidora?.deliveryTimeHours ?? 48))
  const [selectedDays, setSelectedDays] = useState(['Lunes', 'Miércoles', 'Viernes'])
  const [saveState, setSaveState] = useState<SaveState>('idle')

  useEffect(() => {
    if (!distribuidora?.id) return

    setBaseLocation({ province: baseProvince, city: baseCity })
    setAddress(baseAddress)
    setLocationKeys(initialLocationKeys)
    setLocationLabels(initialLabels)
    setMinOrder(String(distribuidora.minOrder ?? 0))
    setDeliveryTime(String(distribuidora.deliveryTimeHours ?? 48))
    if (distribuidora.deliveryHours) {
      const existingDays = DELIVERY_DAYS.filter(day => distribuidora.deliveryHours.includes(day))
      if (existingDays.length > 0) setSelectedDays(existingDays)
    }
    setSaveState('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [distribuidora?.id])

  // ── Locality actions ────────────────────────────────────────────────────────
  const addLocation = () => {
    if (!isValidProvince(locationDraft.province) || !isValidLocality(locationDraft.province, locationDraft.city)) return
    const normalized = normalizeLocationInput(locationDraft)
    if (locationKeys.includes(normalized.locationKey)) return
    setLocationKeys(prev => [...prev, normalized.locationKey])
    setLocationLabels(prev => ({
      ...prev,
      [normalized.locationKey]: `${normalized.city}, ${normalized.province}`,
    }))
    setLocationDraft({ province: '', city: '' })
  }

  const removeLocation = (locationKey: string) => {
    setLocationKeys(prev => prev.filter(key => key !== locationKey))
  }

  // ── Delivery days ───────────────────────────────────────────────────────────
  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const canSave =
    !!address.trim() &&
    isValidProvince(baseLocation.province) &&
    isValidLocality(baseLocation.province, baseLocation.city)

  const handleSave = async () => {
    if (!distribuidora?.id) return
    if (!canSave) {
      setSaveState('error')
      return
    }

    setSaveState('saving')
    try {
      const normalizedBaseLocation = normalizeLocationInput(baseLocation)

      await updateDocument(COLLECTIONS.distributors, distribuidora.id, {
        address: address.trim(),
        city: normalizedBaseLocation.city,
        citySlug: normalizedBaseLocation.citySlug,
        province: normalizedBaseLocation.province,
        provinceSlug: normalizedBaseLocation.provinceSlug,
        locationKey: normalizedBaseLocation.locationKey,
        lat: null,
        lng: null,
        location: normalizedBaseLocation,
        minimumOrder: Number(minOrder) || 0,
        deliveryTimeHours: Number(deliveryTime) || 48,
        deliveryHours: selectedDays.join(', '),
        deliveryLocationKeys: locationKeys,
        deliveryZoneKeys: locationKeys,
        deliveryZones: locationKeys.map(key => locationLabels[key] ?? key),
      })

      setSaveState('saved')
      window.setTimeout(() => setSaveState('idle'), 2200)
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-5 md:pt-6 pb-4">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-2xl text-foreground">Zonas de entrega</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Definí ubicación base, localidades cubiertas y condiciones de reparto.</p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saveState === 'saving' || !canSave}
            className={`hidden sm:inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              saveState === 'saved'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : saveState === 'error'
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-[#0B1A45]/10 bg-[#0B1A45] text-white shadow-sm hover:bg-[#14265f]'
            }`}
          >
            {saveState === 'saving' ? (
              <SavingDots />
            ) : saveState === 'saved' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saveLabel}
          </button>
        </div>
      </header>

      <div className="px-4 md:px-8 pt-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Ubicación base */}
          <div className="bg-white rounded-3xl shadow-md border border-border p-6 md:col-span-2">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Ubicación base</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  La dirección es informativa y queda lista para futura geocodificación.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saveState === 'saving' || !canSave}
                className={`flex h-9 w-fit items-center gap-2 rounded-full border px-3 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 sm:hidden ${
                  saveState === 'saved'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : saveState === 'error'
                      ? 'border-red-200 bg-red-50 text-red-600'
                      : 'border-[#0B1A45]/10 bg-[#0B1A45] text-white shadow-sm'
                }`}
              >
                {saveState === 'saving' ? (
                  <SavingDots />
                ) : saveState === 'saved' ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                {saveLabel}
              </button>
            </div>
            <LocationSelector
              value={baseLocation}
              onChange={setBaseLocation}
              address={address}
              onAddressChange={setAddress}
              compact
            />
          </div>

          {/* Localidades cubiertas — EDITABLE */}
          <div className="bg-white rounded-3xl shadow-md border border-border p-6 md:col-span-2">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-1">Zonas cubiertas</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Los comercios de estas localidades verán tu distribuidora en sus resultados.
            </p>

            {locationKeys.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-5">
                {locationKeys.map((locationKey) => (
                  <span
                    key={locationKey}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary font-semibold text-sm px-3 py-1.5 rounded-full"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {locationLabels[locationKey] ?? locationKey}
                    <button
                      type="button"
                      onClick={() => removeLocation(locationKey)}
                      className="ml-0.5 rounded-full hover:text-red-500 transition-colors"
                      aria-label={`Quitar ${locationLabels[locationKey] ?? locationKey}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-5 italic">Sin localidades seleccionadas</p>
            )}

            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Agregar localidad</p>
              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
                <LocationSelector
                  value={locationDraft}
                  onChange={setLocationDraft}
                  compact
                />
                <button
                  type="button"
                  onClick={addLocation}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Condiciones generales */}
          <div className="bg-white rounded-3xl shadow-md border border-border p-6">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-5">Condiciones generales</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Mínimo de compra ($)
                </label>
                <input
                  type="number"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-1.5">
                  Tiempo estimado de entrega (horas hábiles)
                </label>
                <input
                  type="number"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide block mb-2">
                  Días de reparto
                </label>
                <div className="flex flex-wrap gap-2">
                  {DELIVERY_DAYS.map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                        selectedDays.includes(day)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary/40'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa — full width */}
          <div className="bg-linear-to-r from-sidebar to-sidebar/80 rounded-3xl p-6 flex items-center gap-5 shadow-md">
            <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Vista previa</p>
              <p className="text-white font-semibold text-base leading-snug">
                Tu distribuidora será visible para comercios en{' '}
                {locationKeys.length > 0 ? (
                  <span className="font-bold">{locationKeys.map(key => locationLabels[key] ?? key).join(', ')}</span>
                ) : (
                  <span className="text-white/50 italic">sin localidades seleccionadas</span>
                )}.
              </p>
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
