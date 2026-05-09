'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Star, Clock, ChevronRight } from 'lucide-react'
import { mockDistributorCards, categories, formatCurrency, mockProducts } from '@/lib/mock-data'
import { CategoryIcon } from '@/components/category-icon'
import { DistributorCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'

export default function BuscarPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const isLoading = useMockLoading()

  const filteredDistributors = mockDistributorCards.filter(d => {
    const distributorProducts = mockProducts.filter((product) => product.distribuidoraId === d.id)
    const matchesSearch = d.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      distributorProducts.some((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = !selectedCategory || d.categories.includes(selectedCategory)
    return matchesSearch && matchesCategory
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 md:px-8 py-4 max-w-5xl mx-auto">
          <h1 className="font-heading font-bold text-xl md:text-2xl text-gray-900 mb-4">Buscar</h1>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar distribuidoras o productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {/* Category filter pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 -mx-4 px-4 md:mx-0 md:px-0">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === null
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === category.name
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CategoryIcon category={category.name} className="h-3.5 w-3.5" />
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Results */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <DistributorCardSkeleton />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredDistributors.length} distribuidora{filteredDistributors.length !== 1 ? 's' : ''} encontrada{filteredDistributors.length !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {filteredDistributors.map((distributor) => (
                <Link key={distributor.id} href={`/comercio/distribuidora/${distributor.id}`}>
                  <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-lg md:text-xl shrink-0 group-hover:bg-red-50 group-hover:text-primary transition-colors">
                        {distributor.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-gray-900 md:text-lg leading-tight group-hover:text-primary transition-colors">
                          {distributor.companyName}
                        </h3>
                        <div className="flex items-center text-xs md:text-sm text-muted-foreground mt-1.5 gap-2">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3 md:h-4 md:w-4" /> {distributor.distance}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-0.5 text-yellow-600 font-medium">
                            <Star className="h-3 w-3 md:h-4 md:w-4 fill-current" /> 4.8
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {distributor.categories.slice(0, 3).map((cat) => (
                            <span key={cat} className="text-xs bg-red-50 text-primary px-2 py-0.5 rounded-full font-medium">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs md:text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-[10px] font-bold">Mínimo</span>
                        <span className="font-medium text-gray-900">{formatCurrency(distributor.minOrder)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-[10px] font-bold">Entrega</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {distributor.deliveryInfo}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {filteredDistributors.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground mb-4">No se encontraron distribuidoras</p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory(null) }}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
