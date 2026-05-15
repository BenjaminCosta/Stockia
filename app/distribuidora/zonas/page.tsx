'use client'

import { useState } from 'react'
import { MapPin, Edit, Save, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { Distribuidora } from '@/lib/types'
import { updateDocument } from '@/lib/firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'

const COVERAGE_OPTIONS = [
  { value: 10, label: '10 km' },
  { value: 20, label: '20 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
]

const DELIVERY_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

export default function ZonasPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null

  const MOCK_ZONES = distribuidora?.deliveryZones ?? ['Avellaneda', 'Lanús', 'Quilmes', 'Lomas de Zamora']
  const baseCity = distribuidora?.location?.city ?? 'Avellaneda'
  const baseAddress = distribuidora?.address ?? 'Ruta 3 km 12, Galpón B'

  const [radius, setRadius] = useState(distribuidora?.coverageRadiusKm ?? 50)
  const [minOrder, setMinOrder] = useState(String(distribuidora?.minOrder ?? 15000))
  const [deliveryTime, setDeliveryTime] = useState(String(distribuidora?.deliveryTimeHours ?? 48))
  const [selectedDays, setSelectedDays] = useState(['Lunes', 'Miércoles', 'Viernes'])
  const [saved, setSaved] = useState(false)

  const toggleDay = (day: string) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleSave = async () => {
    if (!distribuidora?.id) return
    try {
      await updateDocument(COLLECTIONS.distributors, distribuidora.id, {
        coverageRadiusKm: radius,
        minimumOrder: Number(minOrder) || 0,
        deliveryTimeHours: Number(deliveryTime) || 48,
        deliveryZones: MOCK_ZONES,
      })
    } catch (err) {
      console.error('[zonas] updateDocument failed', err)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-5 md:pt-6 pb-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-foreground">Zonas de entrega</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Definí dónde puede vender y entregar tu distribuidora.</p>
        </div>
      </header>

      {/* Cards */}
      <div className="px-4 md:px-8 pt-6 pb-16 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Ubicación base */}
          <div className="bg-white rounded-3xl shadow-md border border-border p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Ubicación base</h2>
              <button className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">
                <Edit className="h-3.5 w-3.5" /> Editar
              </button>
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
              <span>Tu catálogo será visible para comercios dentro de este radio.</span>
            </div>
          </div>

          {/* Localidades cubiertas */}
          <div className="bg-white rounded-3xl shadow-md border border-border p-6">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-5">Localidades cubiertas</h2>
            <div className="flex flex-wrap gap-2">
              {MOCK_ZONES.map((zone) => (
                <span
                  key={zone}
                  className="flex items-center gap-1.5 bg-primary/10 text-primary font-semibold text-sm px-3 py-1.5 rounded-full"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {zone}
                </span>
              ))}
            </div>
            <button className="mt-4 text-xs text-primary font-semibold hover:underline">
              + Agregar localidad
            </button>
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
          <div className="md:col-span-2 bg-linear-to-r from-sidebar to-sidebar/80 rounded-3xl p-6 flex items-center gap-5 shadow-md">
            <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-1">Vista previa</p>
              <p className="text-white font-semibold text-base leading-snug">
                Tu distribuidora será visible para comercios dentro de{' '}
                <span className="font-bold">{radius} km</span>{' '}
                de <span className="font-bold">{baseCity}</span>.
              </p>
              <p className="text-white/50 text-sm mt-1">
                Localidades: {MOCK_ZONES.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-semibold flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saved ? '¡Guardado!' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </div>
  )
}
