'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Plus, Search, Library, AlertCircle, CheckCircle,
  ImageOff, Upload, ChevronRight, X, Loader2,
} from 'lucide-react'
import {
  getMasterProducts,
  seedFoodiProducts,
  searchMasterProductsLocal,
  updateMasterProduct,
  deleteMasterProduct,
  invalidateMasterProductsCache,
} from '@/lib/data/masterProducts.service'
import { foodiArProducts } from '@/lib/data/masterProducts.foodi'
import type { MasterProduct } from '@/lib/types'
import { getCategoryFallbackImage } from '@/lib/data/categoryFallbacks'

// ─── Tab definition ────────────────────────────────────────────────────────────

type Tab = 'all' | 'review' | 'no_image'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',      label: 'Todos' },
  { id: 'review',   label: 'Pendientes' },
  { id: 'no_image', label: 'Sin imagen' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusLabel(s: MasterProduct['status']) {
  return s === 'active' ? 'Activo' : s === 'review' ? 'Pendiente' : 'Desactivado'
}

function statusClass(s: MasterProduct['status']) {
  return s === 'active'
    ? 'bg-green-50 text-green-700'
    : s === 'review'
    ? 'bg-amber-50 text-amber-700'
    : 'bg-gray-100 text-gray-500'
}

function productImage(p: MasterProduct) {
  return p.imageUrl || getCategoryFallbackImage(p.categoryId)
}

// ─── Seed dialog ───────────────────────────────────────────────────────────────

function SeedFoodiDialog({
  onClose,
  onDone,
}: {
  onClose: () => void
  onDone: () => void
}) {
  const [state, setState] = useState<'preview' | 'seeding' | 'done' | 'error'>('preview')
  const [result, setResult] = useState<{ ok: number; skipped: number } | null>(null)
  const [error, setError] = useState('')

  const total = foodiArProducts.length

  const handleSeed = async () => {
    setState('seeding')
    try {
      const r = await seedFoodiProducts(foodiArProducts)
      setResult(r)
      setState('done')
      invalidateMasterProductsCache()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setState('error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={state !== 'seeding' ? onClose : undefined} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-[#F1FFD1] rounded-xl flex items-center justify-center">
              <Upload className="h-4.5 w-4.5 text-[#4A662E]" />
            </div>
            <h2 className="font-heading font-bold text-base text-gray-900">Importar FooDI-ML</h2>
          </div>
          {state !== 'seeding' && (
            <button onClick={onClose} className="h-7 w-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Preview */}
        {state === 'preview' && (
          <>
            {total === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 mb-2">No hay productos generados todavía.</p>
                <p className="text-xs text-gray-400">
                  Corré primero el pipeline Python:
                </p>
                <code className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 block mt-2 text-left">
                  python scripts/foodi/filter_foodi_ar.py --limit 50{'\n'}
                  python scripts/foodi/download_foodi_images.py --limit 50
                </code>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Se importarán <span className="font-bold text-gray-900">{total}</span> productos
                  del dataset FooDI-ML a la colección <code className="text-xs bg-gray-100 px-1 rounded">masterProducts</code>.
                  Los ya existentes serán omitidos.
                </p>
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-4">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Las imágenes deben estar en <code>public/products/foodi-ar/</code> (ya generadas por el script).
                  </p>
                </div>
              </>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              {total > 0 && (
                <button onClick={handleSeed} className="flex-1 h-10 rounded-xl bg-[#0B1A45] text-white text-sm font-bold hover:bg-[#14265f] transition-colors">
                  Importar {total}
                </button>
              )}
            </div>
          </>
        )}

        {/* Seeding */}
        {state === 'seeding' && (
          <div className="flex flex-col items-center py-6 gap-3">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-gray-500">Importando productos...</p>
          </div>
        )}

        {/* Done */}
        {state === 'done' && result && (
          <div className="flex flex-col items-center py-4 gap-3 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-heading font-bold text-gray-900">{result.ok} productos importados</p>
              {result.skipped > 0 && (
                <p className="text-xs text-gray-400 mt-1">{result.skipped} omitidos (ya existían)</p>
              )}
            </div>
            <button
              onClick={() => { onDone(); onClose() }}
              className="mt-2 h-10 px-6 rounded-xl bg-[#0B1A45] text-white text-sm font-bold hover:bg-[#14265f] transition-colors"
            >
              Ver catálogo
            </button>
          </div>
        )}

        {/* Error */}
        {state === 'error' && (
          <div className="flex flex-col items-center py-4 gap-3 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={onClose} className="h-10 px-6 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCatalogoPage() {
  const [all, setAll] = useState<MasterProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [showSeedDialog, setShowSeedDialog] = useState(false)

  const load = () => {
    setLoading(true)
    getMasterProducts().then(data => {
      setAll(data)
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let base = all
    if (tab === 'review')   base = base.filter(p => p.status === 'review')
    if (tab === 'no_image') base = base.filter(p => !p.imageUrl || p.imageStatus === 'missing')
    return searchMasterProductsLocal(base, query)
  }, [all, tab, query])

  const counts = useMemo(() => ({
    all:      all.length,
    review:   all.filter(p => p.status === 'review').length,
    no_image: all.filter(p => !p.imageUrl || p.imageStatus === 'missing').length,
  }), [all])

  const handleToggleStatus = async (p: MasterProduct) => {
    const next = p.status === 'active' ? 'disabled' : 'active'
    setAll(prev => prev.map(x => x.id === p.id ? { ...x, status: next } : x))
    await updateMasterProduct(p.id, { status: next })
  }

  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-5xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-2xl text-gray-900">Catálogo maestro</h1>
          <p className="text-gray-500 text-sm mt-1">
            {all.length} productos · {all.filter(p => p.status === 'active').length} activos
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowSeedDialog(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#F1FFD1] text-[#4A662E] rounded-xl text-sm font-semibold hover:bg-[#e4f7b0] transition-colors border border-[#C8FF00]/30"
          >
            <Upload className="h-4 w-4" /> Importar FooDI-ML
          </button>
          <Link
            href="/admin/catalogo/nuevo"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Nuevo producto
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                tab === t.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'
              }`}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, marca, categoría..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <Library className="h-7 w-7 text-gray-300" />
          </div>
          <p className="font-semibold text-gray-500">
            {all.length === 0
              ? 'El catálogo está vacío'
              : 'Ningún producto coincide con la búsqueda'}
          </p>
          {all.length === 0 && (
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              Importá productos desde FooDI-ML o creá uno manualmente.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-gray-200 hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Image */}
              <Link href={`/admin/catalogo/${p.id}`} className="block">
                <div className="relative aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                  {productImage(p) ? (
                    <Image
                      src={productImage(p)}
                      alt={p.name}
                      fill
                      className="object-contain p-3"
                      unoptimized
                    />
                  ) : (
                    <ImageOff className="h-8 w-8 text-gray-200" />
                  )}
                  {p.imageStatus === 'needs_review' && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400" title="Imagen pendiente de revisión" />
                  )}
                </div>
              </Link>

              {/* Info */}
              <div className="p-3">
                <Link href={`/admin/catalogo/${p.id}`}>
                  <p className="font-semibold text-xs text-gray-900 line-clamp-2 leading-snug hover:underline mb-1">
                    {p.name}
                  </p>
                </Link>
                <p className="text-[10px] text-gray-400 truncate mb-2">
                  {p.brand ? `${p.brand} · ` : ''}{p.categoryId}
                </p>
                <div className="flex items-center justify-between gap-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${statusClass(p.status)}`}>
                    {statusLabel(p.status)}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      title={p.status === 'active' ? 'Desactivar' : 'Activar'}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors text-[10px] font-bold"
                    >
                      {p.status === 'active' ? '—' : '✓'}
                    </button>
                    <Link
                      href={`/admin/catalogo/${p.id}`}
                      className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Seed dialog */}
      {showSeedDialog && (
        <SeedFoodiDialog
          onClose={() => setShowSeedDialog(false)}
          onDone={() => { invalidateMasterProductsCache(); load() }}
        />
      )}
    </div>
  )
}
