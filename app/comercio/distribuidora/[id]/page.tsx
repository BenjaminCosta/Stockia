'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Plus, Minus, Info, Package, FileText, Check } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import {
  getDistribuidoraById,
  getProductsByDistribuidora,
  formatCurrency
} from '@/lib/mock-data'
import { ProductCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'

export default function DistribuidoraCatalogPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { addToCart, removeFromCart, updateCartItemQuantity } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [cartItems, setCartItems] = useState<Record<string, number>>({})
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())
  const isLoading = useMockLoading()

  const distribuidora = getDistribuidoraById(id)
  const products = getProductsByDistribuidora(id)

  const productCategories = [...new Set(products.map(p => p.category))]
  const categoryList = ['Todos', ...productCategories]

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory
    return matchesSearch && matchesCategory && p.active
  })

  const totalItems = Object.values(cartItems).reduce((a, b) => a + b, 0)
  const totalAmount = Object.entries(cartItems).reduce((sum, [pId, qty]) => {
    const p = products.find(prod => prod.id === pId)
    return sum + (p?.price || 0) * qty
  }, 0)

  const handleAgregar = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product || !distribuidora) return
    addToCart(product, distribuidora.companyName, 1)
    setAddedProducts(prev => new Set(prev).add(productId))
    setCartItems(prev => ({ ...prev, [productId]: 1 }))
    window.setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev)
        next.delete(productId)
        return next
      })
    }, 900)
  }

  const handleIncrement = (productId: string) => {
    const next = (cartItems[productId] || 0) + 1
    updateCartItemQuantity(productId, next)
    setCartItems(prev => ({ ...prev, [productId]: next }))
  }

  const handleDecrement = (productId: string) => {
    const current = cartItems[productId] || 0
    if (current <= 1) {
      removeFromCart(productId)
      setCartItems(prev => {
        const { [productId]: _, ...rest } = prev
        return rest
      })
    } else {
      const next = current - 1
      updateCartItemQuantity(productId, next)
      setCartItems(prev => ({ ...prev, [productId]: next }))
    }
  }

  if (!distribuidora) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Distribuidora no encontrada</p>
        <Link href="/comercio" className="text-primary mt-2">Volver al inicio</Link>
      </div>
    )
  }

  const initials = distribuidora.companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-background pb-44 md:pb-12">
      <div className="md:flex max-w-7xl mx-auto items-start md:p-6 gap-8">
        <div className="flex-1">
          {/* Dark hero header */}
          <div className="bg-sidebar text-white pt-6 pb-8 md:pb-12 px-4 md:px-8 md:rounded-3xl rounded-b-3xl relative overflow-hidden">
            <svg className="absolute right-0 top-0 h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100%" cy="0" r="40%" fill="none" stroke="white" strokeWidth="40" />
            </svg>
            <div className="relative z-10">
              <Link href="/comercio" className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 mb-6 transition-colors md:mb-8">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-heading font-bold text-2xl md:text-4xl mb-2">{distribuidora.companyName}</h1>
                  <div className="flex items-center gap-3 text-white/70 text-sm md:text-base font-medium">
                    <span className="flex items-center gap-1.5">
                      <FileText className="h-4 w-4" /> Mín. {formatCurrency(distribuidora.minOrder || 15000)}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="flex items-center gap-1.5">
                      <Package className="h-4 w-4" /> 48hs hábiles
                    </span>
                  </div>
                </div>
                <div className="hidden md:flex h-20 w-20 rounded-2xl bg-white items-center justify-center font-bold text-primary text-3xl shrink-0 shadow-xl">
                  {initials}
                </div>
              </div>
            </div>
          </div>

          {/* Floating info card */}
          <div className="px-4 md:px-8 -mt-4 relative z-10">
            <div className="bg-white rounded-xl shadow-md p-4 flex items-center gap-4 text-sm border border-gray-100">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <p className="text-gray-600">
                Haciendo pedido hoy, recibís el <span className="font-bold text-foreground text-base">Jueves</span>
              </p>
            </div>
          </div>

          <div className="md:px-8 md:mt-8">
            {/* Category pills */}
            <div className="mt-6 px-4 md:px-0">
              <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {categoryList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/50 hover:text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Search */}
            <div className="px-4 md:px-0 mt-4 md:mt-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre, marca o código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-primary shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Products */}
            <div className="px-4 md:px-0 mt-6">
              {isLoading ? (
                <ProductCardSkeleton />
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No se encontraron productos</p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 pb-12">
                  {filteredProducts.map(product => {
                    const qty = cartItems[product.id] || 0
                    const stockLabel = product.stock > 10 ? 'En stock' : product.stock > 0 ? 'Poco stock' : 'Sin stock'
                    const stockClass = product.stock > 10
                      ? 'bg-green-100 text-green-700'
                      : product.stock > 0
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-500'

                    return (
                      <div
                        key={product.id}
                        className="bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 shadow-sm border border-border flex flex-col gap-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold bg-gray-50 px-2 py-1 rounded">
                                {product.category}
                              </span>
                              <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${stockClass}`}>
                                {stockLabel}
                              </span>
                            </div>
                            <Link href={`/comercio/producto/${product.id}`} className="hover:text-primary transition-colors">
                              <h3 className="font-bold text-foreground text-base md:text-lg leading-tight">{product.name}</h3>
                            </Link>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-heading font-bold text-primary text-xl md:text-2xl">
                              {formatCurrency(product.price)}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-50">
                          <Link href={`/comercio/producto/${product.id}`} className="text-xs font-bold text-gray-500 hover:text-foreground underline">
                            Ver detalle
                          </Link>
                          {qty > 0 ? (
                            <div className="flex items-center gap-2">
                              {addedProducts.has(product.id) && (
                                <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 animate-onboarding-step">
                                  <Check className="h-3 w-3" />
                                  Agregado
                                </span>
                              )}
                              <div className="flex items-center bg-gray-100 rounded-xl h-10 md:h-12 overflow-hidden shadow-inner">
                                <button
                                  onClick={() => handleDecrement(product.id)}
                                  className="w-10 md:w-12 h-full flex items-center justify-center text-gray-600 hover:text-foreground hover:bg-gray-200 transition-colors"
                                >
                                  <Minus className="h-4 w-4 md:h-5 md:w-5" />
                                </button>
                                <span className="w-10 md:w-12 text-center font-bold text-base bg-white h-full flex items-center justify-center">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => handleIncrement(product.id)}
                                  className="w-10 md:w-12 h-full flex items-center justify-center text-primary hover:text-red-700 hover:bg-gray-200 transition-colors"
                                >
                                  <Plus className="h-4 w-4 md:h-5 md:w-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAgregar(product.id)}
                              disabled={product.stock === 0}
                              className={`px-6 md:px-8 h-10 md:h-12 rounded-xl text-sm md:text-base font-bold transition-all shadow-sm ${
                                product.stock === 0
                                  ? 'bg-gray-100 text-muted-foreground cursor-not-allowed'
                                  : 'bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white'
                              }`}
                            >
                              Agregar
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop sticky cart sidebar */}
        {totalItems > 0 && (
          <div className="hidden md:block w-[360px] shrink-0 sticky top-8">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gray-50 p-6 border-b border-gray-100 flex justify-between items-center">
                <h2 className="font-heading font-bold text-xl text-foreground">Tu Pedido</h2>
                <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-sm">
                  {totalItems} ítems
                </span>
              </div>
              <div className="p-6">
                <div className="max-h-[400px] overflow-y-auto pr-2 space-y-4 mb-6">
                  {Object.entries(cartItems).map(([pId, qty]) => {
                    const p = products.find(prod => prod.id === pId)
                    if (!p) return null
                    return (
                      <div key={pId} className="flex justify-between items-start gap-4 text-sm">
                        <div className="flex-1">
                          <p className="font-bold text-foreground leading-tight">{p.name}</p>
                          <p className="text-muted-foreground mt-1">{formatCurrency(p.price)} x {qty}</p>
                        </div>
                        <div className="font-heading font-bold text-foreground shrink-0">
                          {formatCurrency(p.price * qty)}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="border-t border-gray-100 pt-6 space-y-3 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl text-foreground pt-2 border-t border-gray-100 mt-2">
                    <span>Total</span>
                    <span className="font-heading text-primary">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
                <Link href="/comercio/carrito">
                  <button className="w-full h-14 text-base font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-red-700 transition-colors">
                    Ir al checkout
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky bottom bar */}
      {totalItems > 0 && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-gray-200 z-40 pb-safe shadow-[0_-8px_30px_-18px_rgba(31,41,55,0.45)]">
          <Link href="/comercio/carrito">
            <div className="bg-primary text-white rounded-2xl p-4 flex justify-between items-center shadow-xl shadow-primary/20 active:scale-[0.98] cursor-pointer transition-all animate-cart-pulse">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl h-10 w-10 flex items-center justify-center font-bold text-lg">
                  {totalItems}
                </div>
                <span className="font-bold text-lg">Ver carrito</span>
              </div>
              <div className="font-heading font-bold text-2xl">{formatCurrency(totalAmount)}</div>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}
