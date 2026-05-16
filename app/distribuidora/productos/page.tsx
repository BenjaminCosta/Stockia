'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Package, Upload, Download, FileSpreadsheet, AlertTriangle } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { EmptyState } from '@/components/ui/EmptyState'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useProducts } from '@/hooks/use-data'
import { Distribuidora } from '@/lib/types'
import { CategoryIcon } from '@/components/category-icon'
import { ProductCardSkeleton } from '@/components/ui/SkeletonCard'
import ImportProductsModal from '@/components/products/ImportProductsModal'
import { exportProductsToXlsx, downloadTemplate } from '@/lib/export/productsExport'
import type { ParsedProductRow } from '@/lib/import/productsImport'
import { createProduct } from '@/lib/data/products.service'

export default function ProductosPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const distributorId = distribuidora?.id || 'dist-1'
  const isBlocked = distribuidora?.commissionStatus === 'blocked'
  const [searchQuery, setSearchQuery] = useState('')
  const [showImport, setShowImport] = useState(false)
  const { data: products, loading: isLoading } = useProducts(distributorId)

  const handleImport = async (rows: ParsedProductRow[]) => {
    await Promise.all(
      rows.map(row =>
        createProduct({
          distributorId,
          name: row.nombre,
          description: row.descripcion,
          categoryId: row.categoria,
          brand: row.marca || undefined,
          sku: row.sku || undefined,
          price: row.precio ?? 0,
          stock: row.stock ?? 0,
          unit: row.unidad || undefined,
          status: row.estado,
        }).catch(err => console.error('[import] createProduct failed', err))
      )
    )
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Blocked banner */}
      {isBlocked && (
        <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-sm">Cuenta bloqueada por comisiones vencidas</p>
            <p className="text-xs text-red-100 mt-0.5">No podés publicar ni activar productos. Contactá a StockIA para regularizar tu situación.</p>
          </div>
        </div>
      )}

      {/* Page header */}
      <header className="sticky top-0 md:top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-5 md:pt-6 pb-0">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-foreground mb-4 md:mb-6">Catálogo de Productos</h1>

          <div className="flex gap-2 pb-4 flex-wrap">
            <SearchInput
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="flex-1 min-w-40"
            />
            {/* Import / Export / Template */}
            <button
              onClick={() => downloadTemplate()}
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Descargar plantilla"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Plantilla</span>
            </button>
            <button
              onClick={() => exportProductsToXlsx(products, 'mis-productos')}
              disabled={products.length === 0}
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Exportar productos"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
            <button
              onClick={() => setShowImport(true)}
              className="h-10 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              title="Importar productos"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar</span>
            </button>
            {isBlocked ? (
              <button
                disabled
                title="Cuenta bloqueada"
                className="bg-gray-200 text-gray-400 px-4 md:px-6 rounded-xl text-sm md:text-base font-bold flex items-center justify-center gap-2 h-10 cursor-not-allowed"
              >
                <Plus className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            ) : (
              <Link href="/distribuidora/productos/nuevo">
                <button className="bg-primary hover:bg-primary/90 text-white px-4 md:px-6 rounded-xl text-sm md:text-base font-bold shadow-sm flex items-center justify-center gap-2 h-10 transition-colors">
                  <Plus className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="hidden sm:inline">Nuevo</span>
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <ProductCardSkeleton />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay productos"
            description={searchQuery ? 'No se encontraron productos' : 'Empezá cargando tu primer producto'}
            actionLabel={!searchQuery ? 'Cargar producto' : undefined}
            actionHref={!searchQuery ? '/distribuidora/productos/nuevo' : undefined}
          />
        ) : (
          <div className="bg-white md:rounded-2xl md:shadow-sm border border-transparent md:border-gray-200 overflow-hidden">
            {/* Desktop header row */}
            <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
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
                  className={`bg-white rounded-2xl md:rounded-none p-5 md:p-4 border border-gray-100 md:border-x-0 md:border-t-0 md:grid md:grid-cols-12 md:gap-4 md:items-center shadow-sm md:shadow-none ${i !== 0 ? 'md:border-t md:border-gray-100' : ''}`}
                >
                  {/* Product name — mobile shows category above, edit btn top-right */}
                  <div className="col-span-4 mb-4 md:mb-0">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 md:hidden">
                          <CategoryIcon category={product.category} className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-gray-500 md:hidden uppercase tracking-wider mb-0.5">{product.category}</div>
                          <div className="font-bold text-foreground text-base md:text-sm leading-tight">{product.name}</div>
                        </div>
                      </div>
                      <div className="md:hidden">
                        <Link href={`/distribuidora/productos/${product.id}`}>
                          <button className="h-8 w-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
                            <Pencil className="h-4 w-4" />
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Category — desktop only */}
                  <div className="col-span-2 hidden md:block text-sm text-gray-600">
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{product.category}</span>
                  </div>

                  {/* Price */}
                  <div className="col-span-2 mb-3 md:mb-0 flex md:block justify-between items-center bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
                    <span className="md:hidden text-xs font-bold text-gray-500 uppercase tracking-wider">Precio</span>
                    <div className="font-heading font-bold text-lg md:text-base text-foreground">{formatCurrency(product.price)}</div>
                  </div>

                  {/* Stock */}
                  <div className="col-span-2 mb-4 md:mb-0 flex md:block justify-between items-center bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
                    <span className="md:hidden text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</span>
                    <div className="text-right md:text-left">
                      <div className="text-base md:text-sm font-bold text-foreground">{product.stock} un.</div>
                      <div className={`text-[10px] font-bold mt-0.5 uppercase tracking-wide ${
                        product.stock > 10 ? 'text-green-600' : product.stock > 0 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {product.stock > 10 ? 'En stock' : product.stock > 0 ? 'Poco stock' : 'Sin stock'}
                      </div>
                    </div>
                  </div>

                  {/* Active toggle */}
                  <div className="col-span-1 flex justify-between md:justify-center items-center pt-3 md:pt-0 border-t border-gray-100 md:border-none">
                    <span className="md:hidden text-sm font-bold text-gray-700">Producto activo</span>
                    <Switch defaultChecked={product.active} className="data-[state=checked]:bg-primary" />
                  </div>

                  {/* Edit — desktop only */}
                  <div className="col-span-1 hidden md:flex justify-end">
                    <Link href={`/distribuidora/productos/${product.id}`}>
                      <button className="h-8 w-8 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 transition-colors">
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
