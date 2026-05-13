'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { mockDistributorCards, mockDistribuidoras, categories } from '@/lib/mock-data'
import { DistributorCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'
import { DistribuidoraCard } from '@/components/distribuidora-card'
import { EmptyState } from '@/components/ui/EmptyState'

// Build a city lookup from the full distribuidoras list
const cityMap: Record<string, string> = Object.fromEntries(
  mockDistribuidoras.map(d => [d.id, d.location?.city || ''])
)

export default function DistribuidorasPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const isLoading = useMockLoading()

  const filtered = mockDistributorCards.filter(d => {
    const matchesSearch =
      d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || d.categories.includes(selectedCategory)
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
      <section className="mx-auto w-full max-w-7xl px-4 py-3 md:px-8 md:py-8">
        <div className="mb-4 rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-sm md:mb-6 md:rounded-[2rem] md:p-5 md:shadow-[0_16px_44px_rgba(24,29,37,0.05)]">
          <div className="mb-2 md:mb-3">
            <div>
              <h1 className="font-heading font-bold text-lg md:text-2xl text-foreground">Distribuidoras</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Encontrá proveedores disponibles cerca de tu comercio.</p>
            </div>
          </div>

          <SearchInput
            placeholder="Buscar distribuidoras..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="max-w-2xl mt-2 md:mt-3"
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => <DistributorCardSkeleton key={i} />)}
          </div>
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
                <DistribuidoraCard key={distributor.id} distributor={distributor} index={index} city={cityMap[distributor.id]} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
