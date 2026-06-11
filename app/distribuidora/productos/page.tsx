'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus, Pencil, Package, Upload, Download, FileSpreadsheet,
  AlertTriangle, CheckCircle2, Trash2, CheckSquare, Square, ImageOff, Bell,
} from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useProductsAll, invalidateProductsCache } from '@/hooks/use-data'
import { Distribuidora } from '@/lib/types'
import { CategoryIcon } from '@/components/category-icon'
import { InventoryTableSkeleton } from '@/components/ui/SkeletonCard'
import ImportProductsModal from '@/components/products/ImportProductsModal'
import { exportProductsToXlsx, downloadTemplate } from '@/lib/export/productsExport'
import type { ParsedProductRow } from '@/lib/import/productsImport'
import { mapToSystemCategory } from '@/lib/import/productsImport'
import type { ImportResult } from '@/components/products/ImportProductsModal'
import { createProduct, updateProduct, deleteProduct, getProductsByDistributorAll } from '@/lib/data/products.service'
import { updateDocument } from '@/lib/firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'

export default function ProductosPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const distributorId = distribuidora?.id || 'dist-1'
  const isBlocked = distribuidora?.commissionStatus === 'blocked'

  const [searchQuery, setSearchQuery]       = useState('')
  const [filterNoImage, setFilterNoImage]   = useState(false)
  const [showImport, setShowImport]         = useState(false)
  const [refreshKey, setRefreshKey]         = useState(0)
  const [importedCount, setImportedCount]   = useState<number | null>(null)

  // Delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingIds, setDeletingIds]         = useState<Set<string>>(new Set())

  // Bulk select state
  const [selectMode, setSelectMode]   = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Toggle active state per product
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set())

  const lowStockThreshold = distribuidora?.lowStockThreshold ?? 10

  // Threshold inline edit (desktop header)
  const [showThresholdEdit, setShowThresholdEdit] = useState(false)
  const [thresholdDraft, setThresholdDraft]       = useState(lowStockThreshold)
  const [savingThreshold, setSavingThreshold]     = useState(false)
  const [thresholdSaved, setThresholdSaved]       = useState(false)

  const handleSaveThreshold = async () => {
    if (!distribuidora?.id) return
    const parsed = Math.max(1, Math.min(9999, Math.floor(thresholdDraft)))
    setSavingThreshold(true)
    try {
      await updateDocument(COLLECTIONS.distributors, distribuidora.id, { lowStockThreshold: parsed })
      setThresholdSaved(true)
      setShowThresholdEdit(false)
      setTimeout(() => setThresholdSaved(false), 2500)
    } catch {
      // silent — user can retry
    } finally {
      setSavingThreshold(false)
    }
  }

  const { data: products, loading: isLoading } = useProductsAll(distributorId, refreshKey)

  const triggerRefresh = useCallback(() => {
    invalidateProductsCache(distributorId)
    setRefreshKey(k => k + 1)
  }, [distributorId])

  // Auto-ocultar el banner de importación cuando termina de cargar
  useEffect(() => {
    if (importedCount !== null && !isLoading) {
      const t = setTimeout(() => setImportedCount(null), 4000)
      return () => clearTimeout(t)
    }
  }, [importedCount, isLoading])

  // Salir del select mode si no quedan resultados
  useEffect(() => {
    if (!isLoading && products.length === 0) {
      setSelectMode(false)
      setSelectedIds(new Set())
    }
  }, [isLoading, products.length])

  // ─── Import ───────────────────────────────────────────────────────────────

  const handleImport = async (rows: ParsedProductRow[]): Promise<ImportResult> => {
    // Obtener productos existentes para detectar duplicados por id interno o SKU
    const existing = await getProductsByDistributorAll(distributorId).catch(() => [])
    const existingIdSet = new Set(existing.map(p => p.id))
    const skuMap = new Map<string, string>() // sku → productId
    for (const p of existing) {
      if (p.sku) skuMap.set(p.sku.trim().toLowerCase(), p.id)
    }

    const results = await Promise.allSettled(
      rows.map(row => {
        const productData = {
          distributorId,
          name: row.nombre,
          description: row.descripcion,
          categoryId: mapToSystemCategory(row.categoria),
          distributorCategory: row.categoria,
          ...(row.marca  ? { brand: row.marca }  : {}),
          ...(row.sku    ? { sku: row.sku }      : {}),
          ...(row.unidad ? { unit: row.unidad }  : {}),
          price: row.precio ?? 0,
          stock: row.stock ?? 0,
          status: row.estado,
        }

        // 1. Match por id_interno (producto exportado desde esta plataforma)
        if (row.id_interno && existingIdSet.has(row.id_interno)) {
          const { distributorId: _d, ...updateData } = productData
          return updateProduct(row.id_interno, updateData)
        }

        // 2. Match por SKU (archivo externo o sin id_interno)
        const skuKey = row.sku?.trim().toLowerCase()
        const existingId = skuKey ? skuMap.get(skuKey) : undefined
        if (existingId) {
          const { distributorId: _d, ...updateData } = productData
          return updateProduct(existingId, updateData)
        }

        // 3. Producto nuevo
        return createProduct(productData)
      })
    )

    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed    = results.filter(r => r.status === 'rejected').length
    if (succeeded > 0) {
      triggerRefresh()
      setImportedCount(succeeded)
    }
    return { succeeded, failed }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (productId: string) => {
    setDeletingIds(prev => new Set(prev).add(productId))
    setConfirmDeleteId(null)
    try {
      await deleteProduct(productId)
      triggerRefresh()
    } finally {
      setDeletingIds(prev => { const n = new Set(prev); n.delete(productId); return n })
    }
  }

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    if (togglingIds.has(productId)) return
    setTogglingIds(prev => new Set(prev).add(productId))
    try {
      await updateProduct(productId, { status: currentActive ? 'paused' : 'active' })
      triggerRefresh()
    } finally {
      setTogglingIds(prev => { const n = new Set(prev); n.delete(productId); return n })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setBulkDeleting(true)
    try {
      await Promise.allSettled([...selectedIds].map(id => deleteProduct(id)))
      triggerRefresh()
      setSelectedIds(new Set())
      setSelectMode(false)
    } finally {
      setBulkDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    }
  }

  // ─── Filter ───────────────────────────────────────────────────────────────

  const noImageCount = useMemo(() => products.filter(p => !p.imageUrl).length, [products])

  const existingSkus = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of products) {
      if (p.sku) map.set(p.sku.trim().toLowerCase(), p.name)
    }
    return map
  }, [products])

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return products.filter(p => {
      if (filterNoImage && p.imageUrl) return false
      return p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    })
  }, [products, searchQuery, filterNoImage])

  const allSelected = filteredProducts.length > 0 && selectedIds.size === filteredProducts.length

  return (
    <div className="flex flex-col min-h-screen">
      {/* Blocked banner */}
      {isBlocked && (
        <div className="mx-4 mt-4 md:mx-8 flex items-start gap-3 rounded-2xl border border-red-200/80 bg-red-50 px-4 py-4 shadow-[0_1px_3px_rgba(239,68,68,0.06)]">
          <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm text-red-900">Cuenta bloqueada por comisiones vencidas</p>
            <p className="text-xs text-red-700 mt-0.5">No podés publicar ni activar productos. Contactá a StockIA para regularizar tu situación.</p>
          </div>
        </div>
      )}

      {/* Page header */}
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#DFE1E8]/80 px-4 md:px-8 pt-4 md:pt-6 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="mb-3 md:mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-0.5">Inventario</p>
              <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-[#0B1A45]">Catálogo de productos</h1>
            </div>
            {!isLoading && products.length > 0 && (
              <span className="shrink-0 mb-1 text-sm font-semibold text-[#7A839C] tabular-nums">
                {products.length} {products.length === 1 ? 'producto' : 'productos'}
              </span>
            )}
          </div>

          <div className="flex gap-2 pb-3.5 flex-wrap">
            <SearchInput
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="flex-1 min-w-40"
            />
            <button
              onClick={() => downloadTemplate()}
              className="h-10 px-3 rounded-xl border border-[#DFE1E8]/80 bg-white hover:bg-[#F7F8FA] text-[#5F6880] text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Descargar plantilla"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Plantilla</span>
            </button>
            <button
              onClick={() => exportProductsToXlsx(products, 'mis-productos')}
              disabled={products.length === 0}
              className="h-10 px-3 rounded-xl border border-[#DFE1E8]/80 bg-white hover:bg-[#F7F8FA] text-[#5F6880] text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Exportar productos"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="h-10 px-3 rounded-xl border border-[#DFE1E8]/80 bg-white hover:bg-[#F7F8FA] text-[#5F6880] text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Importar productos"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            {/* Threshold button — desktop only */}
            <div className="relative hidden md:block shrink-0">
              <button
                onClick={() => { setThresholdDraft(lowStockThreshold); setShowThresholdEdit(v => !v) }}
                title="Umbral de stock bajo"
                className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  thresholdSaved
                    ? 'border-[#89B317]/40 bg-[#F1FFD1] text-[#4A662E]'
                    : 'border-[#DFE1E8]/80 bg-white hover:bg-[#F7F8FA] text-[#5F6880]'
                }`}
              >
                <Bell className="h-3.5 w-3.5 shrink-0" />
                <span>{thresholdSaved ? '¡Guardado!' : `Alerta: ${lowStockThreshold} un.`}</span>
              </button>

              {showThresholdEdit && (
                <div className="absolute right-0 top-12 z-30 w-64 rounded-2xl border border-[#DFE1E8]/80 bg-white shadow-[0_4px_20px_rgba(11,26,69,0.12)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#7A839C] mb-2">Umbral de stock bajo</p>
                  <p className="text-xs text-[#7A839C] mb-3 leading-snug">Alertar cuando el stock sea igual o menor a este número.</p>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={thresholdDraft}
                      onChange={e => setThresholdDraft(Number(e.target.value))}
                      className="w-20 font-bold text-sm text-[#0B1A45] bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#C8FF00]/40 focus:border-[#C8FF00]/60"
                    />
                    <span className="text-sm text-[#7A839C]">unidades</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowThresholdEdit(false)}
                      className="flex-1 h-8 rounded-xl border border-[#DFE1E8]/80 text-xs font-semibold text-[#5F6880] hover:bg-[#F7F8FA] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveThreshold}
                      disabled={savingThreshold}
                      className="flex-1 h-8 rounded-xl bg-[#0B1A45] hover:bg-[#14265f] text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      {savingThreshold ? 'Guardando...' : 'Guardar'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isBlocked ? (
              <button
                disabled
                title="Cuenta bloqueada"
                className="bg-[#DFE1E8]/60 text-[#7A839C] px-4 md:px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 h-10 cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            ) : (
              <Link href="/distribuidora/productos/nuevo">
                <button className="bg-[#0B1A45] hover:bg-[#14265f] text-white px-4 md:px-5 rounded-xl text-sm font-bold shadow-sm flex items-center justify-center gap-2 h-10 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nuevo</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">

        {/* Banner post-import */}
        {importedCount !== null && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm">
            {isLoading
              ? <div className="h-4 w-4 shrink-0 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
              : <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
            }
            <span className="font-semibold text-green-800">
              {isLoading
                ? `Importando ${importedCount} productos al catálogo...`
                : `${importedCount} productos importados correctamente`}
            </span>
          </div>
        )}

        {isLoading ? (
          <InventoryTableSkeleton count={6} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay productos"
            description={searchQuery ? 'No se encontraron productos' : 'Empezá cargando tu primer producto'}
            actionLabel={!searchQuery ? 'Cargar producto' : undefined}
            actionHref={!searchQuery ? '/distribuidora/productos/nuevo' : undefined}
          />
        ) : (
          <div className="bg-white md:rounded-2xl md:shadow-[0_1px_3px_rgba(11,26,69,0.05),0_6px_20px_rgba(11,26,69,0.07)] border border-transparent md:border-[#DFE1E8]/80 overflow-hidden">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#DFE1E8]/60 bg-[#F7F8FA]">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setSelectMode(s => !s); setSelectedIds(new Set()); setConfirmDeleteId(null) }}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${selectMode ? 'text-primary' : 'text-[#7A839C] hover:text-[#5F6880]'}`}
                >
                  {selectMode ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                  {selectMode ? 'Cancelar' : 'Seleccionar'}
                </button>
                {!selectMode && noImageCount > 0 && (
                  <button
                    onClick={() => setFilterNoImage(f => !f)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors px-2.5 py-1 rounded-lg border ${
                      filterNoImage
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-white border-[#DFE1E8]/80 text-[#7A839C] hover:text-[#5F6880]'
                    }`}
                  >
                    <ImageOff className="h-3.5 w-3.5" />
                    {filterNoImage ? 'Ver todos' : `${noImageCount} sin imagen`}
                  </button>
                )}
              </div>

              {selectMode && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs font-semibold text-[#5F6880] hover:text-[#0B1A45] transition-colors"
                  >
                    {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkDeleting}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors disabled:opacity-60"
                    >
                      {bulkDeleting
                        ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />
                      }
                      Eliminar {selectedIds.size} {selectedIds.size === 1 ? 'producto' : 'productos'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2.5 border-b border-[#DFE1E8]/80 text-[10px] font-bold text-[#7A839C] uppercase tracking-[0.14em]">
              <div className="col-span-4">Producto</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-2">Precio</div>
              <div className="col-span-2">Stock</div>
              <div className="col-span-1 text-center">Activo</div>
              <div className="col-span-1 text-right">Acciones</div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 md:p-0 md:gap-0">
              {filteredProducts.map((product, i) => {
                const isConfirming = confirmDeleteId === product.id
                const isBeingDeleted = deletingIds.has(product.id)
                const isSelected = selectedIds.has(product.id)

                return (
                  <div
                    key={product.id}
                    className={`bg-white rounded-2xl md:rounded-none p-4 md:p-4 border border-[#DFE1E8]/60 md:border-x-0 md:border-t-0 md:grid md:grid-cols-12 md:gap-4 md:items-center shadow-[0_1px_3px_rgba(11,26,69,0.04)] md:shadow-none transition-colors ${
                      isSelected ? 'bg-blue-50/40' : ''
                    } ${i !== 0 ? 'md:border-t md:border-[#DFE1E8]/60' : ''} ${
                      isBeingDeleted ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    {/* Product name — with optional checkbox */}
                    <div className="col-span-4 mb-3 md:mb-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Checkbox (select mode) — desktop only; mobile has its own below */}
                          {selectMode && (
                            <button
                              onClick={() => toggleSelect(product.id)}
                              className="hidden md:inline-flex shrink-0 text-[#5F6880] hover:text-primary transition-colors"
                            >
                              {isSelected
                                ? <CheckSquare className="h-4 w-4 text-primary" />
                                : <Square className="h-4 w-4" />
                              }
                            </button>
                          )}
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-9 h-9 rounded-xl object-cover shrink-0 bg-gray-100"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gray-100 border border-dashed border-gray-300" title="Sin imagen">
                              <ImageOff className="h-3.5 w-3.5 text-gray-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-[10px] font-bold text-[#7A839C] md:hidden uppercase tracking-[0.14em] mb-0.5">{product.category}</div>
                            <div className="font-bold text-[#0B1A45] text-sm leading-tight truncate">{product.name}</div>
                            {product.sku && (
                              <div className="text-[10px] text-[#7A839C] font-mono mt-0.5 truncate">#{product.sku}</div>
                            )}
                          </div>
                        </div>

                        {/* Mobile: edit + delete buttons */}
                        {!selectMode && (
                          <div className="md:hidden shrink-0 flex items-center gap-1.5">
                            {isConfirming ? (
                              <>
                                <button
                                  onClick={() => handleDelete(product.id)}
                                  className="h-8 px-2.5 rounded-xl bg-red-500 text-white text-xs font-bold transition-colors"
                                >
                                  Eliminar
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="h-8 w-8 rounded-xl bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold transition-colors"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <Link href={`/distribuidora/productos/${product.id}`}>
                                  <button className="h-8 w-8 rounded-xl bg-[#F7F8FA] hover:bg-[#EFF0F3] border border-[#DFE1E8]/60 flex items-center justify-center text-[#5F6880] transition-colors">
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                </Link>
                                <button
                                  onClick={() => setConfirmDeleteId(product.id)}
                                  className="h-8 w-8 rounded-xl bg-[#F7F8FA] hover:bg-red-50 hover:border-red-200 border border-[#DFE1E8]/60 flex items-center justify-center text-[#5F6880] hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        {/* Mobile: select checkbox */}
                        {selectMode && (
                          <button
                            onClick={() => toggleSelect(product.id)}
                            className="md:hidden shrink-0 text-[#5F6880] hover:text-primary transition-colors"
                          >
                            {isSelected
                              ? <CheckSquare className="h-5 w-5 text-primary" />
                              : <Square className="h-5 w-5" />
                            }
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Category — desktop */}
                    <div className="col-span-2 hidden md:block">
                      <span className="bg-[#F7F8FA] border border-[#DFE1E8]/60 px-2 py-1 rounded-lg text-xs font-semibold text-[#5F6880]">{product.category}</span>
                    </div>

                    {/* Price */}
                    <div className="col-span-2 mb-2.5 md:mb-0 flex md:block justify-between items-center">
                      <span className="md:hidden text-[10px] font-bold text-[#7A839C] uppercase tracking-[0.14em]">Precio</span>
                      <div className="font-heading font-bold text-base md:text-sm text-[#0B1A45]">{formatCurrency(product.price)}</div>
                    </div>

                    {/* Stock */}
                    <div className="col-span-2 mb-3 md:mb-0 flex md:block justify-between items-center gap-2">
                      <span className="md:hidden text-[10px] font-bold text-[#7A839C] uppercase tracking-[0.14em]">Stock</span>
                      <div className="flex items-center gap-1.5 md:flex-col md:items-start">
                        <span className="font-bold text-sm text-[#0B1A45]">{product.stock} un.</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          product.stock > lowStockThreshold
                            ? 'bg-[#F4FBE7] text-[#4A662E]'
                            : product.stock > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-600'
                        }`}>
                          {product.stock > lowStockThreshold ? 'En stock' : product.stock > 0 ? 'Poco stock' : 'Sin stock'}
                        </span>
                      </div>
                    </div>

                    {/* Active toggle */}
                    <div className="col-span-1 flex justify-between md:justify-center items-center pt-3 md:pt-0 border-t border-[#DFE1E8]/40 md:border-none">
                      <span className="md:hidden text-sm font-semibold text-[#0B1A45]">Producto activo</span>
                      <Switch
                        checked={product.active}
                        disabled={togglingIds.has(product.id)}
                        onCheckedChange={() => handleToggleActive(product.id, product.active)}
                        className="data-[state=checked]:bg-[#0B1A45] disabled:opacity-50"
                      />
                    </div>

                    {/* Desktop actions: edit + delete */}
                    <div className="col-span-1 hidden md:flex justify-end items-center gap-1.5">
                      {isConfirming ? (
                        <>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="h-8 px-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors whitespace-nowrap"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="h-8 w-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs transition-colors"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <Link href={`/distribuidora/productos/${product.id}`}>
                            <button className="h-8 w-8 rounded-xl bg-[#F7F8FA] hover:bg-[#EFF0F3] border border-[#DFE1E8]/60 flex items-center justify-center text-[#5F6880] transition-colors" title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setConfirmDeleteId(product.id)}
                            className="h-8 w-8 rounded-xl bg-[#F7F8FA] hover:bg-red-50 hover:border-red-200 border border-[#DFE1E8]/60 flex items-center justify-center text-[#5F6880] hover:text-red-500 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Import modal */}
      {showImport && (
        <ImportProductsModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
          existingSkus={existingSkus}
        />
      )}
    </div>
  )
}
