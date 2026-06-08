'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, Save, Trash2, Plus, X, ImageOff,
  Loader2, AlertCircle,
} from 'lucide-react'
import {
  getMasterProductById,
  createMasterProduct,
  updateMasterProduct,
  deleteMasterProduct,
  invalidateMasterProductsCache,
} from '@/lib/data/masterProducts.service'
import { normalizeProductName } from '@/lib/import/productMatcher'
import { ImageUploader } from '@/components/ui/ImageUploader'
import { useImageUpload } from '@/hooks/use-image-upload'
import { getCategoryFallbackImage } from '@/lib/data/categoryFallbacks'
import type { MasterProduct } from '@/lib/types'

const CATEGORIES = [
  'bebidas', 'almacen', 'lacteos', 'limpieza', 'snacks',
  'perfumeria', 'mascotas', 'panaderia', 'fiambres', 'congelados', 'golosinas', 'otros',
]

const IS_NEW = 'nuevo'

// ─── Alias tag input ───────────────────────────────────────────────────────────

function AliasInput({
  aliases,
  onChange,
}: {
  aliases: string[]
  onChange: (v: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  const add = () => {
    const val = normalizeProductName(draft.trim())
    if (val && !aliases.includes(val)) {
      onChange([...aliases, val])
    }
    setDraft('')
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-8">
        {aliases.map(a => (
          <span key={a} className="flex items-center gap-1 bg-[#F1FFD1] text-[#4A662E] text-xs font-semibold px-2 py-1 rounded-full">
            {a}
            <button
              type="button"
              onClick={() => onChange(aliases.filter(x => x !== a))}
              className="text-[#4A662E]/60 hover:text-[#4A662E] transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {aliases.length === 0 && (
          <span className="text-xs text-gray-400">Sin aliases todavía</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Ej: coca 225 · agregar y presionar Enter"
          className="flex-1 bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-3 py-2 text-xs font-medium text-[#0B1A45] placeholder:text-[#7A839C] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20"
        />
        <button
          type="button"
          onClick={add}
          disabled={!draft.trim()}
          className="h-9 w-9 rounded-xl bg-[#0B1A45] text-white flex items-center justify-center hover:bg-[#14265f] disabled:opacity-40 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">
        Los aliases se normalizan automáticamente (minúsculas, sin tildes, sin puntuación).
      </p>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminCatalogoItemPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const isNew = id === IS_NEW

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [normalizedName, setNormalizedName] = useState('')
  const [brand, setBrand] = useState('')
  const [categoryId, setCategoryId] = useState('otros')
  const [unit, setUnit] = useState('')
  const [aliases, setAliases] = useState<string[]>([])
  const [status, setStatus] = useState<MasterProduct['status']>('review')
  const [currentImageUrl, setCurrentImageUrl] = useState('')

  // Image upload — stored in Firebase Storage under master-products/{id}/
  const imageUpload = useImageUpload({
    type: 'product',
    ownerId: isNew ? `master-new-${Date.now()}` : id,
  })

  // Load existing product
  useEffect(() => {
    if (isNew) return
    getMasterProductById(id).then(p => {
      if (!p) { router.replace('/admin/catalogo'); return }
      setName(p.name)
      setNormalizedName(p.normalizedName)
      setBrand(p.brand)
      setCategoryId(p.categoryId)
      setUnit(p.unit)
      setAliases(p.aliases)
      setStatus(p.status)
      setCurrentImageUrl(p.imageUrl)
      setLoading(false)
    })
  }, [id, isNew, router])

  // Auto-generate normalizedName when name changes
  const handleNameChange = useCallback((val: string) => {
    setName(val)
    setNormalizedName(normalizeProductName(val))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es requerido.'); return }
    setSaving(true)
    setError('')
    try {
      const finalImageUrl = imageUpload.imageUrl || currentImageUrl
      const data = {
        name: name.trim(),
        normalizedName: normalizedName || normalizeProductName(name.trim()),
        brand: brand.trim(),
        categoryId,
        unit: unit.trim(),
        aliases,
        imageUrl: finalImageUrl,
        imageSource: finalImageUrl
          ? (imageUpload.imageUrl ? 'admin_upload' : 'foodi_ml') as MasterProduct['imageSource']
          : undefined,
        imageStatus: finalImageUrl ? 'approved' as const : 'missing' as const,
        status,
      }

      if (isNew) {
        await createMasterProduct(data)
      } else {
        await updateMasterProduct(id, data)
      }

      invalidateMasterProductsCache()
      router.push('/admin/catalogo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteMasterProduct(id)
      invalidateMasterProductsCache()
      router.push('/admin/catalogo')
    } catch {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const previewImg = imageUpload.previewUrl || currentImageUrl || getCategoryFallbackImage(categoryId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#DFE1E8]/80">
        <div className="flex items-center h-14 px-4 max-w-2xl mx-auto gap-3">
          <Link
            href="/admin/catalogo"
            className="h-9 w-9 rounded-xl bg-[#F7F8FA] border border-[#DFE1E8]/80 flex items-center justify-center text-[#5F6880] hover:bg-[#EFF0F3] transition-colors"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Catálogo maestro</p>
            <h1 className="font-heading font-bold text-lg tracking-tight text-[#0B1A45] leading-tight">
              {isNew ? 'Nuevo producto' : 'Editar producto'}
            </h1>
          </div>
          {!isNew && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="h-9 w-9 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full pb-12">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Image */}
          <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-3">Imagen</p>
            <div className="flex gap-4 items-start">
              {/* Current/preview */}
              <div className="relative h-24 w-24 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                {previewImg ? (
                  <Image src={previewImg} alt={name || 'preview'} fill className="object-contain p-2" unoptimized />
                ) : (
                  <ImageOff className="h-6 w-6 text-gray-300" />
                )}
                {currentImageUrl && !imageUpload.previewUrl && (
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/40 text-white px-1 rounded">actual</span>
                )}
              </div>
              {/* Uploader */}
              <div className="flex-1">
                <ImageUploader
                  previewUrl={imageUpload.previewUrl}
                  progress={imageUpload.progress}
                  isUploading={imageUpload.isUploading}
                  error={imageUpload.error}
                  onFileSelect={imageUpload.upload}
                  onRemove={imageUpload.reset}
                  hint="PNG, JPG o WebP hasta 5 MB"
                />
              </div>
            </div>
          </div>

          {/* Main info */}
          <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05)] p-5 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Información</p>

            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-[#5F6880] mb-1.5">
                Nombre <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ej: Coca-Cola 2.25L"
                required
                className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0B1A45] placeholder:text-[#7A839C] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20"
              />
            </div>

            {/* Normalized name */}
            <div>
              <label className="block text-xs font-bold text-[#5F6880] mb-1.5">
                Nombre normalizado <span className="text-[#7A839C] font-normal">(auto-generado, editable)</span>
              </label>
              <input
                type="text"
                value={normalizedName}
                onChange={e => setNormalizedName(e.target.value)}
                placeholder="Se genera automáticamente al escribir el nombre"
                className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-4 py-2.5 text-sm font-mono text-[#0B1A45] placeholder:text-[#7A839C] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Clave de matching: minúsculas, sin tildes, medidas normalizadas.
              </p>
            </div>

            {/* Brand + Unit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#5F6880] mb-1.5">Marca</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Ej: Coca-Cola"
                  className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0B1A45] placeholder:text-[#7A839C] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5F6880] mb-1.5">Unidad</label>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="Ej: 2.25L"
                  className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0B1A45] placeholder:text-[#7A839C] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20"
                />
              </div>
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#5F6880] mb-1.5">Categoría</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0B1A45] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20"
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#5F6880] mb-1.5">Estado</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as MasterProduct['status'])}
                  className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0B1A45] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20"
                >
                  <option value="active">Activo</option>
                  <option value="review">Pendiente revisión</option>
                  <option value="disabled">Desactivado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Aliases */}
          <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-3">
              Aliases de matching
            </p>
            <p className="text-xs text-gray-500 mb-3">
              Variantes de nombre por las que se puede encontrar este producto al importar.
              Ej: "coca 225", "coca cola 225l", "coca-cola 225".
            </p>
            <AliasInput aliases={aliases} onChange={setAliases} />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-xl border border-[#DFE1E8]/80 bg-[#F7F8FA] text-sm font-semibold text-[#5F6880] hover:bg-[#EFF0F3] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 rounded-xl bg-[#0B1A45] hover:bg-[#14265f] text-white text-sm font-bold shadow-sm transition-colors gap-2 flex items-center justify-center disabled:opacity-60"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="h-4 w-4" /> {isNew ? 'Crear producto' : 'Guardar cambios'}</>
              )}
            </button>
          </div>
        </form>
      </main>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 mx-4">
            <h3 className="font-heading font-bold text-lg text-gray-900 mb-2">Eliminar producto</h3>
            <p className="text-sm text-gray-500 mb-5">
              ¿Confirmás que querés eliminar <strong>{name}</strong> del catálogo maestro? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 h-10 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
