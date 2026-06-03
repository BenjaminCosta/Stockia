import { cn } from '@/lib/utils'

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-[#EEF1F5]',
        'after:absolute after:inset-0 after:-translate-x-full after:animate-stockia-shimmer after:bg-linear-to-r after:from-transparent after:via-white/75 after:to-transparent',
        className
      )}
    />
  )
}

type SkeletonListProps = {
  count?: number
  className?: string
}

export function DistributorCardSkeleton({ count = 3, className }: SkeletonListProps) {
  return (
    <div
      className={cn('grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-5 xl:grid-cols-3', className)}
      aria-busy="true"
      aria-label="Cargando distribuidoras"
    >
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-2xl border border-[#DFE1E8] bg-white shadow-[0_1px_3px_rgba(11,26,69,0.05),0_14px_36px_rgba(11,26,69,0.06)] md:rounded-3xl"
        >
          <SkeletonBlock className="h-16 rounded-none bg-[#0B1A45]/10 md:h-24" />
          <div className="relative px-3 pb-3 md:px-5 md:pb-5">
            <SkeletonBlock className="absolute -top-6 left-3 h-12 w-12 rounded-xl bg-white shadow-md ring-1 ring-[#DFE1E8] md:-top-10 md:left-5 md:h-20 md:w-20 md:rounded-2xl" />
            <div className="space-y-3 pt-8 md:pt-12">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <SkeletonBlock className="h-4 w-3/4" />
                  <SkeletonBlock className="h-3 w-4/5" />
                </div>
                <SkeletonBlock className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex gap-2">
                <SkeletonBlock className="h-5 w-20 rounded-full" />
                <SkeletonBlock className="h-5 w-14 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#DFE1E8]/70 bg-[#F7F8FA] p-3">
                {[0, 1, 2].map(item => (
                  <div key={item} className="space-y-2">
                    <SkeletonBlock className="h-2.5 w-12" />
                    <SkeletonBlock className="h-4 w-14" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function ProductCardSkeleton({ count = 6, className }: SkeletonListProps) {
  return (
    <div
      className={cn('grid grid-cols-2 gap-3 lg:grid-cols-4', className)}
      aria-busy="true"
      aria-label="Cargando productos"
    >
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(11,26,69,0.06),0_12px_28px_rgba(11,26,69,0.07)]"
        >
          <div className="relative">
            <SkeletonBlock className="aspect-square w-full rounded-none" />
            <SkeletonBlock className="absolute bottom-2 left-2 h-8 w-8 rounded-full bg-white ring-1 ring-[#DFE1E8] md:h-9 md:w-9" />
            <SkeletonBlock className="absolute right-2 top-2 h-7 w-7 rounded-full bg-white/90" />
          </div>
          <div className="space-y-3 p-2.5 pt-3 md:p-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-3.5 w-11/12" />
              <SkeletonBlock className="h-3.5 w-2/3" />
            </div>
            <SkeletonBlock className="h-3 w-1/2" />
            <SkeletonBlock className="h-6 w-24" />
            <div className="flex items-center gap-2 pt-1">
              <SkeletonBlock className="hidden h-9 w-24 rounded-xl md:block" />
              <SkeletonBlock className="h-8 w-8 rounded-xl md:h-9 md:flex-1" />
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export function InventoryTableSkeleton({ count = 6, className }: SkeletonListProps) {
  return (
    <div
      className={cn('overflow-hidden rounded-2xl border border-[#DFE1E8] bg-white shadow-[0_12px_34px_rgba(11,26,69,0.06)]', className)}
      aria-busy="true"
      aria-label="Cargando catalogo"
    >
      <div className="hidden grid-cols-12 gap-4 border-b border-[#DFE1E8] bg-[#F7F8FA] p-4 md:grid">
        <SkeletonBlock className="col-span-4 h-3 w-24" />
        <SkeletonBlock className="col-span-2 h-3 w-20" />
        <SkeletonBlock className="col-span-2 h-3 w-16" />
        <SkeletonBlock className="col-span-2 h-3 w-16" />
        <SkeletonBlock className="col-span-1 h-3 w-12" />
        <SkeletonBlock className="col-span-1 h-3 w-10 justify-self-end" />
      </div>
      <div className="grid gap-4 p-4 md:gap-0 md:p-0">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-[#DFE1E8] bg-white p-5 shadow-sm md:grid md:grid-cols-12 md:items-center md:gap-4 md:rounded-none md:border-x-0 md:border-b-0 md:border-t md:p-4 md:shadow-none"
          >
            <div className="col-span-4 mb-4 flex items-center gap-3 md:mb-0">
              <SkeletonBlock className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-4/5" />
                <SkeletonBlock className="h-3 w-2/5 md:hidden" />
              </div>
            </div>
            <SkeletonBlock className="col-span-2 hidden h-7 w-24 rounded-full md:block" />
            <SkeletonBlock className="col-span-2 mb-3 h-12 rounded-xl md:mb-0 md:h-5 md:w-20" />
            <SkeletonBlock className="col-span-2 mb-4 h-12 rounded-xl md:mb-0 md:h-5 md:w-16" />
            <SkeletonBlock className="col-span-1 h-7 w-12 rounded-full md:justify-self-center" />
            <SkeletonBlock className="col-span-1 hidden h-8 w-8 rounded-lg md:block md:justify-self-end" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function OrderCardSkeleton({ count = 4, className }: SkeletonListProps) {
  return (
    <div className={cn('space-y-3', className)} aria-busy="true" aria-label="Cargando pedidos">
      {Array.from({ length: count }).map((_, index) => (
        <article
          key={index}
          className="rounded-[1.35rem] border border-[#DFE1E8] bg-white p-4 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_14px_34px_rgba(11,26,69,0.06)]"
        >
          <div className="mb-4 flex items-start justify-between gap-4">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <SkeletonBlock className="h-7 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-3 border-t border-[#DFE1E8]/70 pt-4">
            <SkeletonBlock className="h-11 w-11 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-4/5 max-w-56" />
              <SkeletonBlock className="h-3 w-32" />
            </div>
            <SkeletonBlock className="h-5 w-20" />
          </div>
        </article>
      ))}
    </div>
  )
}

export function DashboardCardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando dashboard">
      <div className="rounded-3xl border border-[#DFE1E8] bg-white p-6 shadow-[0_18px_50px_rgba(11,26,69,0.08)]">
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-40" />
          </div>
          <SkeletonBlock className="h-7 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-[#DFE1E8]/70 pt-5">
          {[0, 1, 2].map(item => (
            <div key={item} className="space-y-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map(item => (
          <div key={item} className="space-y-3 rounded-2xl border border-[#DFE1E8] bg-white p-4 shadow-sm">
            <SkeletonBlock className="h-9 w-9 rounded-xl" />
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function DistribuidoraDashboardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando dashboard de distribuidora">
      <div className="rounded-2xl border border-[#DFE1E8]/80 bg-white p-4 shadow-[0_1px_3px_rgba(11,26,69,0.05),0_16px_38px_rgba(11,26,69,0.08)] md:rounded-3xl md:p-6">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-10 w-44" />
          </div>
          <SkeletonBlock className="h-7 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3 border-t border-[#DFE1E8]/70 pt-5">
          {[0, 1, 2].map(item => (
            <div key={item} className="space-y-2">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-6 w-14" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {[0, 1].map(item => (
          <div key={item} className="flex items-center gap-3 rounded-2xl border border-[#DFE1E8] bg-white p-4 shadow-sm">
            <SkeletonBlock className="h-11 w-11 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="h-3 w-48 max-w-full" />
            </div>
            <SkeletonBlock className="h-7 w-16 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_10px_30px_rgba(11,26,69,0.07)] md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
        <OrderCardSkeleton count={3} />
      </div>
    </div>
  )
}

export function ReviewsDashboardSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando resenas">
      <div className="rounded-3xl border border-[#DFE1E8] bg-white p-5 shadow-[0_14px_38px_rgba(11,26,69,0.06)]">
        <div className="mb-5 flex items-center gap-5">
          <SkeletonBlock className="h-20 w-20 shrink-0 rounded-2xl" />
          <div className="flex-1 space-y-2.5">
            {[0, 1, 2, 3].map(item => (
              <SkeletonBlock key={item} className="h-4 w-full" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map(item => (
            <SkeletonBlock key={item} className="h-16 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map(item => (
          <SkeletonBlock key={item} className="h-20 rounded-2xl bg-white" />
        ))}
      </div>
      <div className="space-y-3">
        {[0, 1, 2].map(item => (
          <SkeletonBlock key={item} className="h-28 rounded-2xl bg-white" />
        ))}
      </div>
    </div>
  )
}

export function SalesDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando ventas">
      <section className="rounded-3xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_10px_30px_rgba(11,26,69,0.07)] md:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-44" />
            <SkeletonBlock className="h-3 w-72 max-w-full" />
          </div>
          <SkeletonBlock className="h-7 w-32 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map(item => (
            <div key={item} className="rounded-2xl border border-[#DFE1E8]/70 bg-white p-4">
              <SkeletonBlock className="mb-3 h-10 w-10 rounded-xl" />
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="mt-2 h-7 w-20" />
            </div>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_320px] lg:items-start">
        <div className="space-y-6">
          <DashboardCardSkeleton />
          <div className="rounded-3xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_10px_30px_rgba(11,26,69,0.07)] md:p-6">
            <SkeletonBlock className="mb-5 h-6 w-40" />
            <OrderCardSkeleton count={3} />
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#DFE1E8]/80 bg-white p-5 shadow-[0_10px_30px_rgba(11,26,69,0.07)]">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="mt-2 h-6 w-48" />
            <div className="mt-5 space-y-3">
              {[0, 1, 2, 3].map(item => (
                <SkeletonBlock key={item} className="h-14 rounded-2xl" />
              ))}
            </div>
          </div>
          <SkeletonBlock className="h-44 rounded-3xl bg-[#0B1A45]/20" />
        </div>
      </div>
    </div>
  )
}

export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-44 md:pb-12" aria-busy="true" aria-label="Cargando producto">
      <div className="mx-auto max-w-6xl md:p-8">
        <div className="h-56 rounded-b-3xl bg-[#080f2b] md:mt-4 md:h-64 md:rounded-3xl" />
        <div className="relative z-10 -mt-8 grid grid-cols-1 gap-6 px-4 md:-mt-12 md:grid-cols-12 md:px-8">
          <div className="space-y-6 md:col-span-8">
            <div className="rounded-3xl border border-[#DFE1E8] bg-white p-6 shadow-md md:p-8">
              <div className="mb-8 flex items-center justify-between">
                <div className="space-y-3">
                  <SkeletonBlock className="h-3 w-28" />
                  <SkeletonBlock className="h-12 w-44" />
                </div>
                <SkeletonBlock className="h-20 w-20 rounded-2xl md:h-24 md:w-24" />
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-[#DFE1E8] pt-6">
                <SkeletonBlock className="h-24 rounded-2xl" />
                <SkeletonBlock className="h-24 rounded-2xl" />
              </div>
            </div>
            <div className="rounded-3xl border border-[#DFE1E8] bg-white p-6 shadow-sm">
              <SkeletonBlock className="mb-4 h-5 w-32" />
              <div className="space-y-2">
                <SkeletonBlock className="h-3 w-full" />
                <SkeletonBlock className="h-3 w-11/12" />
                <SkeletonBlock className="h-3 w-3/4" />
              </div>
            </div>
          </div>
          <div className="space-y-4 md:col-span-4">
            <div className="rounded-3xl border border-[#DFE1E8] bg-white p-5 shadow-md">
              <SkeletonBlock className="mb-4 h-5 w-28" />
              <SkeletonBlock className="h-12 w-full rounded-2xl" />
              <SkeletonBlock className="mt-4 h-12 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function DistributorDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background pb-44 md:pb-12" aria-busy="true" aria-label="Cargando distribuidora">
      <div className="mx-auto max-w-7xl md:p-6">
        <div className="md:flex md:items-start md:gap-8">
          <div className="flex-1">
            <div className="h-56 rounded-b-3xl bg-[#080f2b] md:h-64 md:rounded-3xl" />

            <div className="px-4 md:px-8 md:mt-8">
              <div className="mt-6 flex gap-2 overflow-hidden md:mt-0">
                <SkeletonBlock className="h-9 w-28 rounded-full" />
                <SkeletonBlock className="h-9 w-24 rounded-full" />
                <SkeletonBlock className="h-9 w-32 rounded-full" />
              </div>

              <SkeletonBlock className="mt-4 h-12 w-full rounded-2xl md:mt-6" />

              <div className="mt-6">
                <ProductCardSkeleton count={6} className="md:grid-cols-2 lg:grid-cols-3" />
              </div>

              <div className="mt-8 rounded-3xl border border-[#DFE1E8] bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center gap-3">
                  <SkeletonBlock className="h-10 w-10 rounded-2xl" />
                  <div className="space-y-2">
                    <SkeletonBlock className="h-5 w-40" />
                    <SkeletonBlock className="h-3 w-28" />
                  </div>
                </div>
                <div className="space-y-3">
                  <SkeletonBlock className="h-24 rounded-2xl" />
                  <SkeletonBlock className="h-24 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function OrderDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_50%,#f3f4f6_100%)] pb-10" aria-busy="true" aria-label="Cargando pedido">
      <div className="mx-auto max-w-4xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex items-center gap-4">
          <SkeletonBlock className="h-10 w-10 rounded-full md:h-12 md:w-12" />
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-28" />
            <SkeletonBlock className="h-7 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#DFE1E8] bg-white p-5 shadow-md md:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="space-y-2">
                <SkeletonBlock className="h-5 w-44" />
                <SkeletonBlock className="h-3 w-32" />
              </div>
              <SkeletonBlock className="h-7 w-28 rounded-full" />
            </div>
            <div className="grid gap-3 border-t border-[#DFE1E8] pt-5 md:grid-cols-5">
              {[0, 1, 2, 3, 4].map(item => (
                <div key={item} className="space-y-2">
                  <SkeletonBlock className="h-9 w-9 rounded-full" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
          <OrderCardSkeleton count={2} />
        </div>
      </div>
    </div>
  )
}

export function EditProductSkeleton() {
  return (
    <div className="flex flex-col min-h-screen" aria-busy="true" aria-label="Cargando producto">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#DFE1E8]/80">
        <div className="flex items-center h-13 px-4 max-w-2xl mx-auto gap-3">
          <SkeletonBlock className="h-9 w-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <SkeletonBlock className="h-2.5 w-16" />
            <SkeletonBlock className="h-4 w-40" />
          </div>
          <SkeletonBlock className="h-9 w-9 rounded-xl shrink-0" />
        </div>
      </div>

      {/* Form cards */}
      <div className="flex-1 px-4 py-5 max-w-2xl mx-auto w-full pb-10 space-y-4">
        {/* Image */}
        <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 p-5">
          <SkeletonBlock className="h-2.5 w-14 mb-3" />
          <SkeletonBlock className="h-36 w-full rounded-xl" />
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 p-5 space-y-4">
          <SkeletonBlock className="h-2.5 w-20" />
          <div className="space-y-1.5">
            <SkeletonBlock className="h-2.5 w-28" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <SkeletonBlock className="h-2.5 w-20" />
            <SkeletonBlock className="h-11 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <SkeletonBlock className="h-2.5 w-24" />
            <SkeletonBlock className="h-20 w-full rounded-xl" />
          </div>
        </div>

        {/* Price & stock */}
        <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 p-5">
          <SkeletonBlock className="h-2.5 w-28 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <SkeletonBlock className="h-2.5 w-14" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <SkeletonBlock className="h-2.5 w-12" />
              <SkeletonBlock className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="bg-white rounded-2xl border border-[#DFE1E8]/80 p-5 space-y-4">
          <SkeletonBlock className="h-2.5 w-20" />
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <SkeletonBlock className="h-3.5 w-28" />
              <SkeletonBlock className="h-2.5 w-40" />
            </div>
            <SkeletonBlock className="h-6 w-11 rounded-full" />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#DFE1E8]/60">
            <div className="space-y-1.5">
              <SkeletonBlock className="h-3.5 w-20" />
              <SkeletonBlock className="h-2.5 w-52 max-w-full" />
            </div>
            <SkeletonBlock className="h-6 w-11 rounded-full" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <SkeletonBlock className="flex-1 h-12 rounded-xl" />
          <SkeletonBlock className="flex-1 h-12 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export { SkeletonBlock }
