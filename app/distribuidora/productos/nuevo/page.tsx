'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package } from 'lucide-react'
import { LoadingButton } from '@/components/ui/LoadingButton'
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
import { ImageUploader } from '@/components/ui/ImageUploader'
import { useImageUpload } from '@/hooks/use-image-upload'

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

  const imageUpload = useImageUpload({
    type: 'product',
    ownerId: currentUser?.id ?? '',
  })

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
        ...(imageUpload.imageUrl ? { imageUrl: imageUpload.imageUrl } : {}),
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#DFE1E8]/80">
        <div className="flex items-center h-13 px-4 max-w-2xl mx-auto gap-3">
          <Link
            href="/distribuidora/productos"
            className="h-9 w-9 rounded-xl bg-[#F7F8FA] border border-[#DFE1E8]/80 flex items-center justify-center text-[#5F6880] hover:bg-[#EFF0F3] transition-colors shrink-0"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Inventario</p>
            <h1 className="font-heading font-bold text-lg tracking-tight text-[#0B1A45] leading-tight">Cargar producto</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full pb-10">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Image upload */}
          <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-3">Imagen</p>
            <ImageUploader
              previewUrl={imageUpload.previewUrl}
              progress={imageUpload.progress}
              isUploading={imageUpload.isUploading}
              error={imageUpload.error}
              onFileSelect={imageUpload.upload}
              onRemove={imageUpload.reset}
            />
          </div>

          {/* Main info */}
          <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05)] p-5 space-y-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">Información</p>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-[#5F6880] mb-1.5">
                Nombre del producto <span className="text-red-400">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="Ej: Coca-Cola 2.25L"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0B1A45] placeholder:text-[#7A839C] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20 focus:border-[#0B1A45]/30 transition-colors"
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-bold text-[#5F6880] mb-1.5">
                Categoría <span className="text-red-400">*</span>
              </label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full bg-[#F7F8FA] border-[#DFE1E8]/80 rounded-xl h-11 text-sm font-semibold text-[#0B1A45] focus:ring-[#0B1A45]/20">
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

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-bold text-[#5F6880] mb-1.5">
                Descripción
              </label>
              <textarea
                id="description"
                placeholder="Descripción del producto..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0B1A45] placeholder:text-[#7A839C] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20 focus:border-[#0B1A45]/30 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Price & Stock */}
          <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-4">Precio y stock</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="price" className="block text-xs font-bold text-[#5F6880] mb-1.5">
                  Precio <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A839C] text-sm font-bold">$</span>
                  <input
                    id="price"
                    type="number"
                    placeholder="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold text-[#0B1A45] placeholder:text-[#7A839C] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20 focus:border-[#0B1A45]/30 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="stock" className="block text-xs font-bold text-[#5F6880] mb-1.5">
                  Stock <span className="text-red-400">*</span>
                </label>
                <input
                  id="stock"
                  type="number"
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  required
                  className="w-full bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#0B1A45] placeholder:text-[#7A839C] focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20 focus:border-[#0B1A45]/30 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Toggles */}
          <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 shadow-[0_1px_3px_rgba(11,26,69,0.05)] p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-4">Visibilidad</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#0B1A45]">En oferta</p>
                <p className="text-xs text-[#7A839C] mt-0.5">Aparece destacado en la sección Ofertas</p>
              </div>
              <Switch checked={isOffer} onCheckedChange={setIsOffer} className="data-[state=checked]:bg-[#0B1A45]" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 h-12 rounded-xl border border-[#DFE1E8]/80 bg-[#F7F8FA] text-sm font-semibold text-[#5F6880] hover:bg-[#EFF0F3] transition-colors"
            >
              Cancelar
            </button>
            <LoadingButton
              type="submit"
              className="flex-1 h-12 rounded-xl bg-[#0B1A45] hover:bg-[#14265f] text-white text-sm font-bold shadow-sm transition-colors gap-2"
              loading={isLoading}
              loadingLabel="Guardando..."
            >
              <Package className="h-4 w-4" />
              Guardar producto
            </LoadingButton>
          </div>
        </form>
      </main>
    </div>
  )
}
