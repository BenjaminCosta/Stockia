'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Package, Upload, Download, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useProducts, invalidateProductsCache } from '@/hooks/use-data'
import { Distribuidora } from '@/lib/types'
import { CategoryIcon } from '@/components/category-icon'
import { InventoryTableSkeleton } from '@/components/ui/SkeletonCard'
import ImportProductsModal from '@/components/products/ImportProductsModal'
import { exportProductsToXlsx, downloadTemplate } from '@/lib/export/productsExport'
import type { ParsedProductRow } from '@/lib/import/productsImport'
import type { ImportResult } from '@/components/products/ImportProductsModal'
import { createProduct } from '@/lib/data/products.service'

export default function ProductosPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const distributorId = distribuidora?.id || 'dist-1'
  const isBlocked = distribuidora?.commissionStatus === 'blocked'
  const [searchQuery, setSearchQuery] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importKey, setImportKey] = useState(0)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const { data: products, loading: isLoading } = useProducts(distributorId, importKey)

  // Auto-ocultar el banner de éxito cuando termina de cargar
  useEffect(() => {
    if (importedCount !== null && !isLoading) {
      const t = setTimeout(() => setImportedCount(null), 4000)
      return () => clearTimeout(t)
    }
  }, [importedCount, isLoading])

  const handleImport = async (rows: ParsedProductRow[]): Promise<ImportResult> => {
    const results = await Promise.allSettled(
      rows.map(row =>
        createProduct({
          distributorId,
          name: row.nombre,
          description: row.descripcion,
          categoryId: row.categoria,
          ...(row.marca    ? { brand: row.marca }    : {}),
          ...(row.sku      ? { sku: row.sku }        : {}),
          ...(row.unidad   ? { unit: row.unidad }    : {}),
          price: row.precio ?? 0,
          stock: row.stock ?? 0,
          status: row.estado,
        })
      )
    )
    const succeeded = results.filter(r => r.status === 'fulfilled').length
    const failed    = results.filter(r => r.status === 'rejected').length
    if (succeeded > 0) {
      invalidateProductsCache(distributorId)
      setImportKey(k => k + 1)
      setImportedCount(succeeded)
    }
    return { succeeded, failed }
  }

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  }, [products, searchQuery])

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
      <header className="sticky top-0 md:top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-[#DFE1E8]/80 px-4 md:px-8 pt-4 md:pt-6 pb-0">
        <div className="max-w-5xl mx-auto">
          <div className="mb-3 md:mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-0.5">Inventario</p>
            <h1 className="font-heading font-bold text-2xl md:text-3xl tracking-tight text-[#0B1A45]">Catálogo de productos</h1>
          </div>

          <div className="flex gap-2 pb-3.5 flex-wrap">
            <SearchInput
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="flex-1 min-w-40"
            />
            {/* Import / Export / Template */}
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
            {/* Desktop header row */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-[#F7F8FA] border-b border-[#DFE1E8]/80 text-[10px] font-bold text-[#7A839C] uppercase tracking-[0.14em]">
              <div className="col-span-4">Producto</div>
              <div className="col-span-2">Categoría</div>
              <div className="col-span-2">Precio</div>
              <div className="col-span-2">Stock</div>
              <div className="col-span-1 text-center">Activo</div>
              <div className="col-span-1 text-right">Edit.</div>
            </div>

            <div className="grid grid-cols-1 gap-4 p-4 md:p-0 md:gap-0">
              {filteredProducts.map((product, i) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-2xl md:rounded-none p-4 md:p-4 border border-[#DFE1E8]/60 md:border-x-0 md:border-t-0 md:grid md:grid-cols-12 md:gap-4 md:items-center shadow-[0_1px_3px_rgba(11,26,69,0.04)] md:shadow-none ${i !== 0 ? 'md:border-t md:border-[#DFE1E8]/60' : ''}`}
                >
                  {/* Product name */}
                  <div className="col-span-4 mb-3 md:mb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 bg-[#F1FFD1] rounded-xl flex items-center justify-center shrink-0 md:hidden">
                          <CategoryIcon category={product.category} className="h-4.5 w-4.5 text-[#4A662E]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-bold text-[#7A839C] md:hidden uppercase tracking-[0.14em] mb-0.5">{product.category}</div>
                          <div className="font-bold text-[#0B1A45] text-sm leading-tight truncate">{product.name}</div>
                        </div>
                      </div>
                      <div className="md:hidden shrink-0">
                        <Link href={`/distribuidora/productos/${product.id}`}>
                          <button className="h-8 w-8 rounded-xl bg-[#F7F8FA] hover:bg-[#EFF0F3] border border-[#DFE1E8]/60 flex items-center justify-center text-[#5F6880] transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Category — desktop only */}
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
                        product.stock > 10
                          ? 'bg-[#F4FBE7] text-[#4A662E]'
                          : product.stock > 0
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-red-50 text-red-600'
                      }`}>
                        {product.stock > 10 ? 'En stock' : product.stock > 0 ? 'Poco stock' : 'Sin stock'}
                      </span>
                    </div>
                  </div>

                  {/* Active toggle */}
                  <div className="col-span-1 flex justify-between md:justify-center items-center pt-3 md:pt-0 border-t border-[#DFE1E8]/40 md:border-none">
                    <span className="md:hidden text-sm font-semibold text-[#0B1A45]">Producto activo</span>
                    <Switch defaultChecked={product.active} className="data-[state=checked]:bg-[#0B1A45]" />
                  </div>

                  {/* Edit — desktop only */}
                  <div className="col-span-1 hidden md:flex justify-end">
                    <Link href={`/distribuidora/productos/${product.id}`}>
                      <button className="h-8 w-8 rounded-xl bg-[#F7F8FA] hover:bg-[#EFF0F3] border border-[#DFE1E8]/60 flex items-center justify-center text-[#5F6880] transition-colors">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Import modal */}
      {showImport && (
        <ImportProductsModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  )
}
