'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Minus, Plus, ShoppingCart,
  Package, Clock, AlertTriangle, ShieldCheck, Star, CheckCircle2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/lib/app-context'
import { mockProducts, formatCurrency, getDistribuidoraById } from '@/lib/mock-data'

export default function ProductoDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { addToCart, cart } = useApp()
  const [qty, setQty] = useState(1)
  const [isAdded, setIsAdded] = useState(false)

  const product = mockProducts.find(p => p.id === id)
  const distribuidora = product ? getDistribuidoraById(product.distribuidoraId) : null

  if (!product || !distribuidora) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Link href="/comercio" className="text-primary mt-2">Volver al inicio</Link>
      </div>
    )
  }

  const stockLabel =
    product.stock > 10 ? 'En stock' :
    product.stock > 0 ? 'Poco stock' : 'Sin stock'

  const stockColor =
    product.stock > 10 ? 'bg-green-100 text-green-700' :
    product.stock > 0 ? 'bg-amber-100 text-amber-700' :
    'bg-gray-100 text-gray-500'

  const distInitials = distribuidora.companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleAddToCart = () => {
    addToCart(product, distribuidora.companyName, qty)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
  }

  const inCart = cart?.items.find(item => item.product.id === id)

  return (
    <div className="min-h-screen bg-background pb-44 md:pb-12">
      <div className="max-w-6xl mx-auto md:p-8">

        {/* Dark hero header */}
        <div className="bg-sidebar pt-6 pb-20 md:pb-24 px-4 md:px-8 relative md:rounded-3xl md:mt-4 overflow-hidden">
          <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
            <circle cx="90%" cy="10%" r="50%" fill="none" stroke="white" strokeWidth="20" />
          </svg>
          <div className="relative z-10">
            <Link
              href={`/comercio/distribuidora/${product.distribuidoraId}`}
              className="inline-flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/10 hover:bg-white/20 mb-4 md:mb-8 transition-colors text-white backdrop-blur-sm"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-white/60 text-xs md:text-sm uppercase tracking-wider font-bold mb-2 block">
                  {product.category}
                </span>
                <h1 className="font-heading font-bold text-2xl md:text-4xl text-white leading-tight max-w-2xl">
                  {product.name}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Floating grid */}
        <div className="px-4 md:px-8 -mt-8 md:-mt-12 relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left — product info */}
          <div className="md:col-span-8 space-y-6">

            {/* Price + distributor/stock */}
            <div className="bg-white rounded-3xl shadow-md border border-border p-6 md:p-8">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Precio unitario</p>
                  <p className="font-heading font-bold text-4xl md:text-5xl text-primary">
                    {formatCurrency(product.price)}
                  </p>
                </div>
                <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-gray-50 flex items-center justify-center text-primary shrink-0 border border-gray-100">
                  <Package className="h-10 w-10 md:h-12 md:w-12" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100 text-sm">
                <div className="bg-gray-50 rounded-2xl p-4 md:p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Distribuidor</p>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-gray-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {distInitials}
                    </div>
                    <p className="font-bold text-foreground leading-tight text-sm">{distribuidora.companyName}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 md:p-5">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Stock disponible</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${stockColor}`}>
                      {stockLabel}
                    </span>
                    <p className="font-bold text-foreground">{product.stock} un.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product info list */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">Información del producto</h2>
              <div className="space-y-4 md:space-y-5 text-sm md:text-base">
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-muted-foreground font-medium">Categoría</span>
                  <span className="font-bold text-foreground bg-gray-100 px-3 py-1 rounded-lg">{product.category}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-muted-foreground font-medium">Unidad de venta</span>
                  <span className="font-bold text-foreground">Por unidad</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-muted-foreground font-medium">Entrega estimada</span>
                  <span className="font-bold flex items-center gap-2 bg-blue-50 text-blue-800 px-3 py-1 rounded-lg">
                    <Clock className="h-4 w-4" /> {distribuidora.deliveryTimeLabel}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-muted-foreground font-medium">Pedido mínimo del distribuidor</span>
                  <span className="font-bold text-foreground">{formatCurrency(distribuidora.minOrder)}</span>
                </div>
              </div>
            </div>

            {/* Low stock warning */}
            {product.stock > 0 && product.stock <= 10 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4 items-start">
                <AlertTriangle className="h-6 w-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-amber-900">Últimas unidades disponibles</h3>
                  <p className="text-sm text-amber-800 mt-1">
                    Queda poco stock de este producto. Te recomendamos pedir ahora antes de que se agote.
                  </p>
                </div>
              </div>
            )}

            {inCart && (
              <p className="text-sm text-primary text-center font-medium">
                Ya tenés {inCart.quantity} en el carrito
              </p>
            )}
          </div>

          {/* Right — desktop sticky actions + reviews */}
          <div className="md:col-span-4 space-y-6">

            {/* Agregar al pedido (desktop only) */}
            <div className="hidden md:block bg-white rounded-3xl shadow-xl border border-gray-200 p-6 sticky top-8">
              <h2 className="font-heading font-bold text-xl text-foreground mb-6">Agregar al pedido</h2>

              <div className="mb-6">
                <p className="text-sm font-bold text-gray-500 mb-3">Cantidad</p>
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-2xl h-14 overflow-hidden">
                  <button
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-14 h-full flex items-center justify-center text-gray-600 hover:text-foreground hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <span className="flex-1 text-center font-bold text-lg bg-white h-full flex items-center justify-center border-x border-gray-200">
                    {qty}
                  </span>
                  <button
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    disabled={qty >= product.stock}
                    className="w-14 h-full flex items-center justify-center text-primary hover:bg-red-50 transition-colors disabled:opacity-40"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 pt-6 border-t border-gray-100">
                <span className="font-medium text-gray-500">Total</span>
                <span className="font-heading font-bold text-3xl text-foreground">
                  {formatCurrency(product.price * qty)}
                </span>
              </div>

              <Button
                className={`w-full h-14 text-base font-bold shadow-lg gap-2 rounded-xl transition-all duration-300 ${
                  isAdded
                    ? 'bg-green-600 hover:bg-green-600 shadow-green-200'
                    : 'shadow-primary/20'
                }`}
                onClick={handleAddToCart}
                disabled={isAdded || product.stock === 0}
              >
                {isAdded ? (
                  <><CheckCircle2 className="h-5 w-5 animate-check-pop" /> Agregado</>
                ) : (
                  <><ShoppingCart className="h-5 w-5" /> Agregar al carrito</>
                )}
              </Button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Compra 100% segura
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-4">Calificaciones</h2>
              <div className="flex items-center gap-4">
                <div className="text-center bg-gray-50 rounded-2xl p-4 min-w-25">
                  <p className="font-heading font-bold text-4xl text-foreground">{product.rating.toFixed(1)}</p>
                  <div className="flex gap-1 justify-center mt-2">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${s <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium">{product.reviewCount} reseñas</p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map(s => (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className="w-2 font-bold text-gray-500">{s}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-yellow-400 h-full rounded-full"
                          style={{ width: s === 5 ? '75%' : s === 4 ? '18%' : s === 3 ? '5%' : '1%' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fixed bottom action */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 pb-safe shadow-[0_-8px_30px_-18px_rgba(31,41,55,0.45)]">
        <div className="flex items-center gap-4 max-w-md mx-auto">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl h-14 overflow-hidden shrink-0">
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              className="w-12 h-full flex items-center justify-center text-gray-600 hover:text-foreground"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="w-10 text-center font-bold text-lg bg-white h-full flex items-center justify-center border-x border-gray-200">
              {qty}
            </span>
            <button
              onClick={() => setQty(q => Math.min(product.stock, q + 1))}
              disabled={qty >= product.stock}
              className="w-12 h-full flex items-center justify-center text-primary disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <Button
            className={`flex-1 h-14 text-base font-bold shadow-lg rounded-xl transition-all duration-300 ${
              isAdded ? 'bg-green-600 hover:bg-green-600 shadow-green-200' : 'shadow-primary/20'
            }`}
            onClick={handleAddToCart}
            disabled={isAdded || product.stock === 0}
          >
            {isAdded ? (
              <><CheckCircle2 className="h-4 w-4 mr-2 animate-check-pop" /> Agregado</>
            ) : (
              <><ShoppingCart className="h-4 w-4 mr-2" /> {formatCurrency(product.price * qty)}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
