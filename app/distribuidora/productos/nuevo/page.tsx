'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { categories } from '@/lib/mock-data'
import { CategoryIcon } from '@/components/category-icon'
import { useApp } from '@/lib/app-context'
import { createProduct } from '@/lib/data/products.service'

export default function NuevoProductoPage() {
  const router = useRouter()
  const { currentUser } = useApp()
  const [isLoading, setIsLoading] = useState(false)

  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [description, setDescription] = useState('')
  const [isOffer, setIsOffer] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    setIsLoading(true)
    try {
      await createProduct({
        distributorId: currentUser.id,
        name,
        description,
        categoryId: category,
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0,
        status: 'active',
        isOffer,
      })
    } catch (err) {
      console.error('[nuevo-producto] createProduct failed', err)
    } finally {
      setIsLoading(false)
      router.push('/distribuidora/productos')
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center h-14 px-4 max-w-2xl mx-auto lg:px-8">
          <Link href="/distribuidora/productos" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="font-heading font-semibold text-lg ml-2 text-foreground">Cargar producto</h1>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full lg:p-8">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-heading text-foreground">Información del producto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image upload */}
              <div className="space-y-2">
                <Label>Imagen del producto</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Arrastrá una imagen o hacé clic para subir
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG hasta 5MB
                  </p>
                </div>
              </div>

              {/* Offer toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div>
                  <p className="font-medium text-foreground">En oferta</p>
                  <p className="text-sm text-muted-foreground">Aparece destacado en la sección Ofertas</p>
                </div>
                <Switch checked={isOffer} onCheckedChange={setIsOffer} />
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del producto</Label>
                <Input
                  id="name"
                  placeholder="Ej: Coca-Cola 2.25L"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        <span className="flex items-center gap-2">
                          <CategoryIcon category={cat.name} className="h-4 w-4" />
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price and Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Precio</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="pl-7 bg-background"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="bg-background"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Descripción del producto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background min-h-[100px]"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <LoadingButton
                  type="submit"
                  className="flex-1"
                  loading={isLoading}
                  loadingLabel="Guardando producto"
                >
                  Guardar producto
                </LoadingButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
