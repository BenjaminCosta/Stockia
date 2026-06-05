import Link from 'next/link'
import type { ReactNode } from 'react'
import { Clock, MapPin, Package, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/mock-data'
import { DistributorCard } from '@/lib/types'
import { cn } from '@/lib/utils'

export const distributorCovers = [
  'from-[#0B1A45] to-[#1a2f5e]',
  'from-[#0B1A45] to-[#0d3d1a]',
  'from-[#2f3132] to-[#575e70]',
  'from-[#0B1A45] via-[#1a3a2e] to-[#2d4d1e]',
]

interface DistribuidoraCardCoverProps {
  cover: string
  className?: string
  children?: ReactNode
}

export function DistribuidoraCardCover({ cover, className, children }: DistribuidoraCardCoverProps) {
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br', cover, className)}>
      <div className="absolute inset-0 bg-[url('/assets/distri-bg.png')] bg-cover bg-center opacity-40 mix-blend-screen" />
      {children}
    </div>
  )
}

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
  const gridCols = showProductCount ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <Link href={`/comercio/distribuidora/${distributor.id}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_1px_3px_rgba(11,26,69,0.05),0_4px_14px_rgba(11,26,69,0.06)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#DFE1E8] hover:shadow-[0_4px_8px_rgba(11,26,69,0.06),0_16px_40px_rgba(11,26,69,0.11)] md:rounded-3xl">
        <DistribuidoraCardCover cover={cover} className="h-14 md:h-24" />

        <div className="relative px-2.5 pb-2.5 md:px-5 md:pb-5">
          {/* Floating logo */}
          <div className="absolute -top-5 left-2.5 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white p-0.5 shadow-md md:-top-10 md:left-5 md:h-20 md:w-20 md:rounded-2xl md:p-1 md:shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-md bg-[#F1FFD1] font-heading text-xs font-bold text-[#4A662E] md:rounded-xl md:text-xl">
              {distributor.initials}
            </div>
          </div>

          {/* Name + status */}
          <div className="flex items-center justify-between gap-2 pt-6 md:pt-12">
            <div className="min-w-0">
              <h3 className="truncate font-heading text-[13px] font-bold text-foreground transition-colors group-hover:text-primary md:text-lg">
                {distributor.companyName}
              </h3>
              <p className="truncate text-[10px] text-muted-foreground md:mt-0.5 md:text-sm">
                {distributor.categories.join(' · ')}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 md:px-2 md:text-[10px]">
              Abierto
            </span>
          </div>

          {/* Distance + rating */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] md:mt-4 md:gap-3 md:text-sm">
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
          <div className={cn('mt-2 grid gap-1 rounded-lg border border-[#DFE1E8]/60 bg-[#F7F8FA] p-1.5 text-[10px] md:mt-5 md:gap-2 md:rounded-2xl md:p-3 md:text-sm', gridCols)}>
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground md:text-[10px]">Mínimo</p>
              <p className="mt-0.5 font-semibold text-foreground">{formatCurrency(distributor.minOrder)}</p>
            </div>
            {showProductCount && (
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground md:text-[10px]">Productos</p>
                <p className="mt-0.5 flex items-center gap-0.5 font-semibold text-foreground">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  {distributor.productCount}
                </p>
              </div>
            )}
            <div>
              <p className="text-[8px] font-bold uppercase tracking-wide text-muted-foreground md:text-[10px]">Entrega</p>
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
