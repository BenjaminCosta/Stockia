'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Clock, MapPin, Package, Search, Star, Truck } from 'lucide-react'
import { mockDistributorCards, mockDistribuidoras, categories, formatCurrency } from '@/lib/mock-data'
import { DistributorCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'
import { DistributorCard } from '@/lib/types'
import { cn } from '@/lib/utils'

// Build a city lookup from the full distribuidoras list
const cityMap: Record<string, string> = Object.fromEntries(
  mockDistribuidoras.map(d => [d.id, d.location?.city || ''])
)

const distributorCovers = [
  'from-[#181D25] to-primary',
  'from-primary to-[#7f1d1d]',
  'from-[#2f3132] to-[#575e70]',
  'from-[#181D25] via-[#312326] to-primary',
]

const distributorBadges = ['Entrega rápida', 'Más pedido', 'Cerca tuyo', 'Mayorista']

function DistribuidoraCard({
  distributor,
  index,
}: {
  distributor: DistributorCard
  index: number
}) {
  const city = cityMap[distributor.id]
  const cover = distributorCovers[index % distributorCovers.length]
  const badge = distributorBadges[index % distributorBadges.length]

  return (
    <Link href={`/comercio/distribuidora/${distributor.id}`} className="group block">
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_12px_38px_rgba(24,29,37,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_48px_rgba(24,29,37,0.12)]">
        <div className={cn('relative h-24 overflow-hidden bg-gradient-to-br', cover)}>
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(45deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:22px_22px,34px_34px]" />
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-sm" />
          <div className="absolute bottom-4 right-5 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
            <Truck className="h-3.5 w-3.5" />
            {badge}
          </div>
        </div>

        <div className="relative px-5 pb-5">
          <div className="absolute -top-10 left-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 bg-white p-1 shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-red-50 font-heading text-xl font-bold text-primary">
              {distributor.initials}
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 pt-12">
            <div className="min-w-0">
              <h3 className="truncate font-heading text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                {distributor.companyName}
              </h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {distributor.categories.join(' · ')}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              Abierto
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {distributor.distance}{city ? ` · ${city}` : ''}
            </span>
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <Star className="h-4 w-4 fill-current" />
              4.{8 + (index % 2)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-3 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Mínimo</p>
              <p className="mt-1 font-semibold text-foreground">{formatCurrency(distributor.minOrder)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Productos</p>
              <p className="mt-1 flex items-center gap-1 font-semibold text-foreground">
                <Package className="h-3.5 w-3.5 text-muted-foreground" />
                {distributor.productCount}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Entrega</p>
              <p className="mt-1 flex items-center gap-1 font-semibold text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {distributor.deliveryInfo.replace('Entrega ', '')}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {distributor.categories.slice(0, 2).join(' · ')}
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-white">
              Ver catálogo
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

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
      <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 rounded-[2rem] border border-gray-200 bg-white/80 p-4 shadow-[0_16px_44px_rgba(24,29,37,0.05)] md:p-5">
          <div className="mb-3">
            <div>
              <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground">Distribuidoras</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Encontrá proveedores disponibles cerca de tu comercio.</p>
            </div>
          </div>

          <div className="relative max-w-2xl mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar distribuidoras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

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
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat.name ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <img src={cat.image} alt="" className="h-4 w-4 shrink-0 object-contain" />
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
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg font-medium">Sin resultados</p>
            <p className="text-sm text-muted-foreground mt-1">Probá con otro término o categoría</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4 font-medium">
              {filtered.length} distribuidora{filtered.length !== 1 ? 's' : ''} disponible{filtered.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
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
