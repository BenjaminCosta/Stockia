'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useApp } from '@/lib/app-context'
import { getProductsByDistribuidora, formatCurrency } from '@/lib/mock-data'
import { Distribuidora } from '@/lib/types'
import { CategoryIcon } from '@/components/category-icon'
import { ProductCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'

export default function ProductosPage() {
  const { currentUser } = useApp()
  const distribuidora = currentUser as Distribuidora | null
  const [searchQuery, setSearchQuery] = useState('')
  const isLoading = useMockLoading()

  const products = getProductsByDistribuidora(distribuidora?.id || 'dist-1')

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex flex-col min-h-screen">
      {/* Page header */}
      <header className="sticky top-0 md:top-0 z-20 bg-white border-b border-border px-4 md:px-8 pt-5 md:pt-6 pb-0">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-heading font-bold text-2xl text-gray-900 mb-4 md:mb-6">Catálogo de Productos</h1>

          <div className="flex gap-2 pb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-10 md:pl-12 pr-4 py-3 md:py-3.5 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
              />
            </div>
            <Link href="/distribuidora/productos/nuevo">
              <button className="bg-primary hover:bg-red-700 text-white px-4 md:px-6 rounded-xl text-sm md:text-base font-bold shadow-sm flex items-center justify-center gap-2 h-full transition-colors">
                <Plus className="h-5 w-5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Nuevo</span>
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <ProductCardSkeleton />
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <Package className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="font-heading font-semibold text-xl text-foreground">No hay productos</h2>
            <p className="text-muted-foreground mt-2 text-center">
              {searchQuery ? 'No se encontraron productos' : 'Empezá cargando tu primer producto'}
            </p>
            {!searchQuery && (
              <Link href="/distribuidora/productos/nuevo" className="mt-6">
                <button className="bg-primary text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Cargar producto
                </button>
              </Link>
            )}
          </div>
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
                          <div className="font-bold text-gray-900 text-base md:text-sm leading-tight">{product.name}</div>
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
                    <div className="font-heading font-bold text-lg md:text-base text-gray-900">{formatCurrency(product.price)}</div>
                  </div>

                  {/* Stock */}
                  <div className="col-span-2 mb-4 md:mb-0 flex md:block justify-between items-center bg-gray-50 md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none">
                    <span className="md:hidden text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</span>
                    <div className="text-right md:text-left">
                      <div className="text-base md:text-sm font-bold text-gray-900">{product.stock} un.</div>
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
    </div>
  )
}
