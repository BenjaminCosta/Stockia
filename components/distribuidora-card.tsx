import Link from 'next/link'
import { Clock, MapPin, Package, Star, Truck } from 'lucide-react'
import { formatCurrency } from '@/lib/mock-data'
import { DistributorCard } from '@/lib/types'
import { cn } from '@/lib/utils'

export const distributorCovers = [
  'from-[#0B1A45] to-[#1a2f5e]',
  'from-[#0B1A45] to-[#0d3d1a]',
  'from-[#2f3132] to-[#575e70]',
  'from-[#0B1A45] via-[#1a3a2e] to-[#2d4d1e]',
]

export const distributorBadges = ['Entrega rápida', 'Más pedido', 'Cerca tuyo', 'Mayorista']

interface DistribuidoraCardProps {
  distributor: DistributorCard
  index: number
  /** Muestra la columna "Productos" en el footer (default: true) */
  showProductCount?: boolean
  /** Ciudad opcional para mostrar junto a la distancia */
  city?: string
}

export function DistribuidoraCard({
  distributor,
  index,
  showProductCount = true,
  city,
}: DistribuidoraCardProps) {
  const cover = distributorCovers[index % distributorCovers.length]
  const badge = distributorBadges[index % distributorBadges.length]
  const gridCols = showProductCount ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <Link href={`/comercio/distribuidora/${distributor.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md md:rounded-3xl md:shadow-[0_12px_38px_rgba(24,29,37,0.07)] md:hover:shadow-[0_20px_48px_rgba(24,29,37,0.12)]">
        {/* Cover gradient */}
        <div className={cn('relative h-16 md:h-24 overflow-hidden bg-gradient-to-br', cover)}>
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(45deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:22px_22px,34px_34px]" />
          <div className="absolute -right-6 -top-8 h-20 w-20 rounded-full bg-white/10 blur-sm md:-right-8 md:-top-10 md:h-28 md:w-28" />
          <div className="absolute bottom-2 right-4 flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-md md:bottom-4 md:right-5 md:px-3 md:py-1 md:text-[11px]">
            <Truck className="h-3 w-3 md:h-3.5 md:w-3.5" />
            {badge}
          </div>
        </div>

        <div className="relative px-3 pb-3 md:px-5 md:pb-5">
          {/* Floating logo */}
          <div className="absolute -top-6 left-3 flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white p-0.5 shadow-md md:-top-10 md:left-5 md:h-20 md:w-20 md:rounded-2xl md:p-1 md:shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#F1FFD1] font-heading text-sm font-bold text-[#4A662E] md:rounded-xl md:text-xl">
              {distributor.initials}
            </div>
          </div>

          {/* Name + status */}
          <div className="flex items-center justify-between gap-2 pt-8 md:pt-12">
            <div className="min-w-0">
              <h3 className="truncate font-heading text-sm font-bold text-foreground transition-colors group-hover:text-primary md:text-lg">
                {distributor.companyName}
              </h3>
              <p className="truncate text-[11px] text-muted-foreground md:mt-0.5 md:text-sm">
                {distributor.categories.join(' · ')}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              Abierto
            </span>
          </div>

          {/* Distance + rating */}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] md:mt-4 md:gap-3 md:text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3 md:h-4 md:w-4" />
              {distributor.distance}{city ? ` · ${city}` : ''}
            </span>
            {distributor.rating ? (
              <span className="flex items-center gap-1 font-semibold text-amber-600">
                <Star className="h-3 w-3 fill-current md:h-4 md:w-4" />
                {distributor.rating.toFixed(1)}
                {distributor.reviewCount !== undefined && (
                  <span className="text-gray-400 font-normal">({distributor.reviewCount})</span>
                )}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-300 text-[10px] md:text-xs">
                <Star className="h-3 w-3 md:h-3.5 md:w-3.5" />
                Sin reseñas
              </span>
            )}
          </div>

          {/* Footer stats */}
          <div className={cn('mt-2 grid gap-1 rounded-lg bg-gray-50 p-2 text-[11px] md:mt-5 md:gap-2 md:rounded-2xl md:p-3 md:text-sm', gridCols)}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground md:text-[10px]">Mínimo</p>
              <p className="mt-0.5 font-semibold text-foreground">{formatCurrency(distributor.minOrder)}</p>
            </div>
            {showProductCount && (
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground md:text-[10px]">Productos</p>
                <p className="mt-0.5 flex items-center gap-0.5 font-semibold text-foreground">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  {distributor.productCount}
                </p>
              </div>
            )}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground md:text-[10px]">Entrega</p>
              <p className="mt-0.5 flex items-center gap-0.5 font-semibold text-foreground">
                <Clock className="h-3 w-3 text-primary" />
                {distributor.deliveryInfo.replace('Entrega ', '')}
              </p>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
