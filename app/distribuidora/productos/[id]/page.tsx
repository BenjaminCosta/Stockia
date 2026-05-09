'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, Trash2 } from 'lucide-react'
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
import { mockProducts, categories } from '@/lib/mock-data'
import { CategoryIcon } from '@/components/category-icon'

export default function EditProductoPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const router = useRouter()
  const product = mockProducts.find(p => p.id === id)
  
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState(product?.name || '')
  const [category, setCategory] = useState(product?.category || '')
  const [price, setPrice] = useState(product?.price?.toString() || '')
  const [stock, setStock] = useState(product?.stock?.toString() || '')
  const [description, setDescription] = useState(product?.description || '')
  const [active, setActive] = useState(product?.active ?? true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    router.push('/distribuidora/productos')
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Producto no encontrado</p>
        <Link href="/distribuidora/productos" className="text-primary mt-2">
          Volver a productos
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto lg:px-8">
          <div className="flex items-center">
            <Link href="/distribuidora/productos" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <h1 className="font-heading font-semibold text-lg ml-2 text-foreground">Editar producto</h1>
          </div>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-5 w-5" />
          </Button>
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
              {/* Current image */}
              <div className="space-y-2">
                <Label>Imagen del producto</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <CategoryIcon category={product.category} className="mx-auto mb-2 h-14 w-14 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Clic para cambiar imagen
                  </p>
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
                <div>
                  <p className="font-medium text-foreground">Producto activo</p>
                  <p className="text-sm text-muted-foreground">
                    Visible para los comercios
                  </p>
                </div>
                <Switch checked={active} onCheckedChange={setActive} />
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
                  loadingLabel="Guardando cambios"
                >
                  Guardar cambios
                </LoadingButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
