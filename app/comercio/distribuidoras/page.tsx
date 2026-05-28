'use client'

import { useState, useMemo } from 'react'
import { Package } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { categories } from '@/lib/mock-data'
import { DistributorCardSkeleton } from '@/components/ui/SkeletonCard'
import { useDistributors } from '@/hooks/use-data'
import { useApp } from '@/lib/app-context'
import { Comercio } from '@/lib/types'
import { DistribuidoraCard } from '@/components/distribuidora-card'
import { EmptyState } from '@/components/ui/EmptyState'

export default function DistribuidorasPage() {
  const { currentUser } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const loc = comercio?.location
  const commerceContext = loc
    ? { lat: loc.lat ?? undefined, lng: loc.lng ?? undefined, locationKey: loc.locationKey, citySlug: loc.citySlug }
    : undefined

  const { data: distributors, loading: isLoading } = useDistributors(commerceContext)

  const filtered = useMemo(() => distributors.filter(d => {
    const q = searchQuery.toLowerCase()
    const matchesSearch = d.companyName.toLowerCase().includes(q) ||
      d.categories.some(c => c.toLowerCase().includes(q))
    const matchesCategory = !selectedCategory || d.categories.includes(selectedCategory)
    return matchesSearch && matchesCategory
  }), [distributors, searchQuery, selectedCategory])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
      <section className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
        <header className="mb-5 md:mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Proveedores
          </p>
          <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">
            Distribuidoras
          </h1>
        </header>

        <div className="mb-4 rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-sm md:mb-6 md:p-4 lg:hidden">
          <SearchInput
            placeholder="Buscar distribuidoras..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="max-w-2xl"
          />

          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === null ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat.name ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <DistributorCardSkeleton count={6} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Sin resultados"
            description="Probá con otro término o categoría"
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
      </section>
    </div>
  )
}
