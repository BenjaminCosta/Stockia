'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/lib/app-context'
import { mockProducts, formatCurrency, getDistribuidoraById } from '@/lib/mock-data'
import { CategoryIcon } from '@/components/category-icon'

export default function ProductoDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const { addToCart, cart, getCartItemCount } = useApp()
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)
  const cartItemCount = getCartItemCount()

  const product = mockProducts.find(p => p.id === id)
  const distribuidora = product ? getDistribuidoraById(product.distribuidoraId) : null

  const handleAddToCart = () => {
    if (!product || !distribuidora) return
    addToCart(product, distribuidora.companyName, quantity)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
  }

  const inCart = cart?.items.find(item => item.product.id === id)

  if (!product || !distribuidora) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Link href="/comercio" className="text-primary mt-2">
          Volver al inicio
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <Link 
            href={`/comercio/distribuidora/${product.distribuidoraId}`} 
            className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="font-heading font-semibold text-foreground">Detalle del producto</h1>
          <Link 
            href="/comercio/carrito" 
            className="relative p-2 -mr-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ShoppingCart className="h-5 w-5 text-foreground" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full">
        {/* Product image */}
        <div className="w-full aspect-square bg-muted flex items-center justify-center sm:aspect-video">
          <CategoryIcon category={product.category} className="h-24 w-24 text-muted-foreground" />
        </div>

        {/* Product info */}
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{product.category}</p>
          <h2 className="font-heading font-semibold text-2xl mt-1 text-foreground">{product.name}</h2>
          
          <div className="flex items-baseline gap-2 mt-3">
            <span className="font-heading font-bold text-3xl text-foreground">
              {formatCurrency(product.price)}
            </span>
            <span className="text-sm text-muted-foreground">por unidad</span>
          </div>

          <div className="mt-4">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium ${
              product.stock > 10 
                ? 'bg-emerald-50 text-emerald-700' 
                : product.stock > 0 
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-red-50 text-red-700'
            }`}>
              {product.stock > 10 
                ? `${product.stock} en stock` 
                : product.stock > 0 
                  ? `Últimas ${product.stock} unidades`
                  : 'Sin stock'}
            </span>
          </div>

          <Card className="mt-6 border-border">
            <CardContent className="p-4">
              <h3 className="font-medium text-foreground mb-2">Descripción</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </CardContent>
          </Card>

          <Card className="mt-4 border-border">
            <CardContent className="p-4">
              <Link 
                href={`/comercio/distribuidora/${distribuidora.id}`}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="font-heading font-bold text-sm text-primary">
                    {distribuidora.companyName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Vendido por</p>
                  <p className="font-medium text-foreground">{distribuidora.companyName}</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {inCart && (
            <p className="text-sm text-primary mt-4 text-center">
              Ya tenés {inCart.quantity} en el carrito
            </p>
          )}
        </div>
      </main>

      {/* Bottom action */}
      <div className="sticky bottom-20 left-0 right-0 p-4 bg-card border-t border-border lg:bottom-0">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          {/* Quantity selector */}
          <div className="flex items-center gap-3 bg-muted rounded-lg p-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-heading font-semibold text-lg text-foreground">
              {quantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Add to cart button */}
          <Button 
            className="flex-1 h-12"
            onClick={handleAddToCart}
            disabled={isAdded || product.stock === 0}
          >
            {isAdded ? 'Agregado al carrito' : `Agregar ${formatCurrency(product.price * quantity)}`}
          </Button>
        </div>
      </div>
    </div>
  )
}
