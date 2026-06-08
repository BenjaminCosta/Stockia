'use client'

import { useState, useMemo } from 'react'
import { MapPin, Package } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { DistributorCardSkeleton } from '@/components/ui/SkeletonCard'
import { useDistributors, useCategories, useProducts } from '@/hooks/use-data'
import { useApp } from '@/lib/app-context'
import { Comercio, Product } from '@/lib/types'
import { DistribuidoraCard } from '@/components/distribuidora-card'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'

export default function DistribuidorasPage() {
  const { currentUser } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const loc = comercio?.location
  const hasLocation = !!(loc?.city)
  const commerceContext = hasLocation
    ? { lat: loc!.lat ?? undefined, lng: loc!.lng ?? undefined, locationKey: loc!.locationKey, citySlug: loc!.citySlug, provinceSlug: loc!.provinceSlug }
    : undefined

  const { data: distributors, loading: isLoading } = useDistributors(commerceContext)
  const { data: categories } = useCategories()
  const { data: products } = useProducts()

  const filtered = useMemo(() => {
    const enriched = distributors.map(d => ({
      ...d,
      productCount: products.filter((p: Product) => p.distribuidoraId === d.id && p.status !== 'paused').length,
    }))
    const q = searchQuery.toLowerCase()
    return enriched.filter(d => {
      const matchesSearch = d.companyName.toLowerCase().includes(q) ||
        d.categories.some(c => c.toLowerCase().includes(q))
      const matchesCategory = !selectedCategory || d.categories.includes(selectedCategory)
      return matchesSearch && matchesCategory
    })
  }, [distributors, products, searchQuery, selectedCategory])

  const locationLabel = [loc?.city, loc?.province].filter(Boolean).join(', ')

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F8FA]">
      {hasLocation && (
        <div className="border-b border-[#DFE1E8] bg-white shadow-[0_1px_4px_rgba(11,26,69,0.05)] lg:hidden">
          <div className="mx-auto max-w-350 px-3 py-3 md:px-8">
            <SearchInput
              placeholder="Buscar distribuidoras..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="max-w-xl"
            />

            <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-hide md:mx-0 md:px-0">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  'shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                  selectedCategory === null
                    ? 'border-[#0B1A45] bg-[#0B1A45] text-white'
                    : 'border-[#DFE1E8] bg-white text-[#7A839C] hover:border-[#0B1A45]/30',
                )}
              >
                Todas
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    'shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                    selectedCategory === cat.name
                      ? 'border-[#0B1A45] bg-[#0B1A45] text-white'
                      : 'border-[#DFE1E8] bg-white text-[#7A839C] hover:border-[#0B1A45]/30',
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className="mx-auto w-full max-w-350 flex-1 px-2.5 py-4 md:px-8 md:py-5">
        <header className="mb-5 md:mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Proveedores
          </p>
          <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">
            Distribuidoras
          </h1>
          {hasLocation && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary" />
              {locationLabel}
            </p>
          )}
        </header>

        {!hasLocation ? (
          <EmptyState
            icon={MapPin}
            imageSrc="/assets/distri-3d.png"
            title="Ubicación no configurada"
            description="Completá tu ubicación para ver las distribuidoras disponibles en tu localidad."
            actionLabel="Completar ubicación"
            actionHref="/comercio/cuenta"
            className="border-0 bg-transparent shadow-none"
          />
        ) : (
          <>
            {isLoading ? (
              <DistributorCardSkeleton count={6} />
            ) : filtered.length === 0 && searchQuery === '' && !selectedCategory ? (
              <EmptyState
                icon={Package}
                imageSrc="/assets/distri-3d.png"
                title="Sin distribuidoras en tu zona"
                description={`Todavía no hay distribuidoras que entreguen en ${locationLabel || 'tu localidad'}. Revisá tu ubicación o volvé más tarde.`}
                actionLabel="Editar ubicación"
                actionHref="/comercio/cuenta"
                className="border-0 bg-transparent shadow-none"
              />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={Package}
                imageSrc="/assets/distri-3d.png"
                title="Sin resultados"
                description="Probá con otro término o categoría"
                className="border-0 bg-transparent shadow-none"
              />
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-3 font-medium">
                  {filtered.length} distribuidora{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
                  {filtered.map((distributor, index) => (
                    <DistribuidoraCard key={distributor.id} distributor={distributor} index={index} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  )
}
