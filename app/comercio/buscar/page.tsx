'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ShoppingCart, Package, AlertTriangle, ChevronRight, MapPin } from 'lucide-react'
import { mockProducts, categories, formatCurrency, mockDistributorCards } from '@/lib/mock-data'
import { useMockLoading } from '@/hooks/use-mock-loading'
import { useApp } from '@/lib/app-context'

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-gray-100 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
        <div className="h-5 bg-gray-100 rounded w-20" />
        <div className="h-8 bg-gray-100 rounded-xl w-28" />
      </div>
    </div>
  )
}

export default function BuscarPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const isLoading = useMockLoading()
  const { getCartItemCount } = useApp()
  const cartItemCount = getCartItemCount()

  const activeProducts = mockProducts.filter(p => p.active)

  const filteredProducts = activeProducts.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getDistributor = (id: string) => mockDistributorCards.find(d => d.id === id)

  const stockState = (stock: number) => {
    if (stock === 0) return { label: 'Sin stock', className: 'bg-gray-100 text-gray-500' }
    if (stock <= 10) return { label: 'Poco stock', className: 'bg-amber-100 text-amber-700' }
    return { label: 'Disponible', className: 'bg-green-100 text-green-700' }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 md:px-8 py-4 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground">Buscar</h1>
              <p className="text-xs text-muted-foreground mt-0.5 hidden md:block">Buscá productos de todas tus distribuidoras</p>
            </div>
            <Link
              href="/comercio/carrito"
              className="hidden md:flex h-10 w-10 bg-gray-50 rounded-full items-center justify-center relative hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar productos, marcas o categorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === null ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat.name ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <img src={cat.image} alt="" className="h-4 w-4 object-contain rounded-full shrink-0" />
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => <ProductSkeleton key={i} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center">
              <Package className="h-7 w-7 text-gray-400" />
            </div>
            <p className="font-semibold text-foreground">Sin resultados</p>
            <p className="text-sm text-muted-foreground">Probá con otro término o categoría</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(null) }}
              className="text-primary text-sm font-semibold hover:underline mt-1"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProducts.map((product) => {
                const dist = getDistributor(product.distribuidoraId)
                const stock = stockState(product.stock)
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-2xl border border-border shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      {(() => {
                        const catObj = categories.find(c => c.name === product.category)
                        return (
                          <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {catObj
                              ? <img src={catObj.image} alt="" className="h-8 w-8 object-contain" />
                              : <Package className="h-6 w-6 text-primary" />}
                          </div>
                        )
                      })()}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{product.name}</h3>
                          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${stock.className}`}>
                            {product.stock <= 10 && product.stock > 0 && <AlertTriangle className="inline h-3 w-3 mr-0.5" />}
                            {stock.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{product.category}</p>
                        {dist && (
                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                            <span className="font-semibold text-foreground/70">{dist.companyName}</span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="h-3 w-3" />{dist.distance}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <div>
                        <p className="font-heading font-bold text-base text-foreground">{formatCurrency(product.price)}</p>
                        {dist && (
                          <p className="text-[10px] text-muted-foreground">Mín. {formatCurrency(dist.minOrder)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {dist && (
                          <Link
                            href={`/comercio/distribuidora/${dist.id}`}
                            className="hidden md:flex text-xs text-primary font-semibold hover:underline"
                          >
                            Ver distribuidora
                          </Link>
                        )}
                        <Link
                          href={`/comercio/producto/${product.id}`}
                          className="flex items-center gap-1 bg-primary text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-primary/90 transition-colors"
                        >
                          Ver producto <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
