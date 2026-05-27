'use client'

import { useState } from 'react'
import { Info, MapPin, Plus, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { Distribuidora } from '@/lib/types'
import { normalizeCitySlug } from '@/lib/firebase/geo'
import { updateDocument } from '@/lib/firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'

// ─── Constants ────────────────────────────────────────────────────────────────

const COVERAGE_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
]

const DELIVERY_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

// All localidades available for quick-add
const ALL_AVAILABLE_ZONES = [
  'Avellaneda', 'Lanús', 'Quilmes', 'Lomas de Zamora', 'Berazategui',
  'Almirante Brown', 'Esteban Echeverría', 'Florencio Varela',
  'Tigre', 'San Isidro', 'Morón', 'La Matanza', 'Merlo',
  'San Martín', 'Tres de Febrero', 'Vicente López',
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZonasPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null

  const baseCity = distribuidora?.location?.city ?? 'Avellaneda'
  const baseAddress = distribuidora?.address ?? '—'

  // ── Editable state ──────────────────────────────────────────────────────────
  const [zones, setZones] = useState<string[]>(
    distribuidora?.deliveryZones?.length ? distribuidora.deliveryZones : [baseCity]
  )
  const [customZone, setCustomZone] = useState('')
  const [radius, setRadius] = useState(distribuidora?.coverageRadiusKm ?? 20)
  const [minOrder, setMinOrder] = useState(String(distribuidora?.minOrder ?? 0))
  const [deliveryTime, setDeliveryTime] = useState(String(distribuidora?.deliveryTimeHours ?? 48))
  const [selectedDays, setSelectedDays] = useState(['Lunes', 'Miércoles', 'Viernes'])
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Zones not yet selected, available as quick-add chips
  const availableToAdd = ALL_AVAILABLE_ZONES.filter(
    z => !zones.some(selected => normalizeCitySlug(selected) === normalizeCitySlug(z))
  )

  // ── Zone actions ────────────────────────────────────────────────────────────
  const addZone = (zone: string) => {
    const trimmed = zone.trim()
    if (!trimmed) return
    if (zones.some(z => normalizeCitySlug(z) === normalizeCitySlug(trimmed))) return
    setZones(prev => [...prev, trimmed])
  }

  const removeZone = (zone: string) => {
    setZones(prev => prev.filter(z => z !== zone))
  }

  const handleAddCustom = () => {
    if (customZone.trim()) {
      addZone(customZone)
      setCustomZone('')
    }
  }

  // ── Delivery days ───────────────────────────────────────────────────────────
  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!distribuidora?.id) return
    setSaving(true)
    try {
      await updateDocument(COLLECTIONS.distributors, distribuidora.id, {
        coverageRadiusKm: radius,
        minimumOrder: Number(minOrder) || 0,
        deliveryTimeHours: Number(deliveryTime) || 48,
        deliveryZones: zones,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('[zonas] updateDocument failed', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-5 md:pt-6 pb-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-foreground">Zonas de entrega</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Definí las localidades donde tu distribuidora reparte y configura condiciones.</p>
        </div>
      </header>

      <div className="px-4 md:px-8 pt-6 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Ubicación base — read-only */}
          <div className="bg-white rounded-3xl shadow-md border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Ubicación base</h2>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Dirección', value: baseAddress },
                { label: 'Ciudad', value: baseCity },
                { label: 'Provincia', value: 'Buenos Aires' },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
                  <span className="text-sm font-semibold text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
              Para cambiar dirección o ciudad, editá desde tu Perfil.
            </p>
          </div>

          {/* Radio de cobertura */}
          <div className="bg-white rounded-3xl shadow-md border border-border p-6">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-5">Radio de cobertura</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {COVERAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRadius(opt.value)}
                  className={`py-3 rounded-xl font-semibold text-sm transition-colors border ${
                    radius === opt.value
                      ? 'bg-primary text-white border-primary'
                      : 'bg-gray-50 text-foreground border-gray-200 hover:border-primary/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-50 border border-blue-100 rounded-xl p-3">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Cuando haya geocodificación, tu catálogo será visible para comercios dentro de este radio. Por ahora, el matching usa las localidades cubiertas.</span>
            </div>
          </div>

          {/* Localidades cubiertas — EDITABLE */}
          <div className="bg-white rounded-3xl shadow-md border border-border p-6 md:col-span-2">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-1">Localidades cubiertas</h2>
            <p className="text-xs text-muted-foreground mb-5">
              Los comercios de estas localidades verán tu distribuidora en sus resultados.
            </p>

            {/* Selected zones (removable chips) */}
            {zones.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-5">
                {zones.map((zone) => (
                  <span
                    key={zone}
                    className="flex items-center gap-1.5 bg-primary/10 text-primary font-semibold text-sm px-3 py-1.5 rounded-full"
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    {zone}
                    <button
                      type="button"
                      onClick={() => removeZone(zone)}
                      className="ml-0.5 rounded-full hover:text-red-500 transition-colors"
                      aria-label={`Quitar ${zone}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-5 italic">Sin localidades seleccionadas</p>
            )}

            {/* Quick-add from predefined list */}
            {availableToAdd.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Agregar localidad</p>
                <div className="flex flex-wrap gap-2">
                  {availableToAdd.map(zone => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => addZone(zone)}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground border border-dashed border-gray-300 px-2.5 py-1.5 rounded-full hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                      {zone}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom zone input */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Otra localidad</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customZone}
                  onChange={e => setCustomZone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
                  placeholder="Ej: Lanús Este, Bernal..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={handleAddCustom}
                  disabled={!customZone.trim()}
                  className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-colors"
                >
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
                {zones.length > 0 ? (
                  <span className="font-bold">{zones.join(', ')}</span>
                ) : (
                  <span className="text-white/50 italic">sin zonas seleccionadas</span>
                )}.
              </p>
              {radius > 0 && (
                <p className="text-white/50 text-sm mt-1">
                  Radio de cobertura: {radius} km (activo cuando haya coordenadas reales)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}
