import { cn } from '@/lib/utils'

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-gray-100 after:absolute after:inset-0 after:-translate-x-full after:animate-stockia-shimmer after:bg-linear-to-r after:from-transparent after:via-white/70 after:to-transparent',
        className
      )}
    />
  )
}

type SkeletonListProps = {
  count?: number
}

export function DistributorCardSkeleton({ count = 4 }: SkeletonListProps) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando distribuidoras">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex gap-4">
            <SkeletonBlock className="h-14 w-14 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-3">
              <SkeletonBlock className="h-4 w-2/3" />
              <SkeletonBlock className="h-3 w-4/5" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-6 w-20 rounded-full" />
                <SkeletonBlock className="h-6 w-24 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProductCardSkeleton({ count = 6 }: SkeletonListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Cargando productos">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="flex gap-4">
            <SkeletonBlock className="h-20 w-20 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-3">
              <SkeletonBlock className="h-4 w-4/5" />
              <SkeletonBlock className="h-3 w-1/3" />
              <SkeletonBlock className="h-5 w-24" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <SkeletonBlock className="h-9 w-28 rounded-lg" />
            <SkeletonBlock className="h-9 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function OrderCardSkeleton({ count = 4 }: SkeletonListProps) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando pedidos">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="mb-4 flex items-start justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <SkeletonBlock className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-3 border-t border-border pt-4">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-44" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
            <SkeletonBlock className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardCardSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando dashboard">
      {/* Main KPI */}
      <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-10 w-40" />
          </div>
          <SkeletonBlock className="h-7 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-5 w-12" />
            </div>
          ))}
        </div>
      </div>
      {/* Secondary cards */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-white p-4 shadow-sm space-y-3">
            <SkeletonBlock className="h-9 w-9 rounded-xl" />
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}

export { SkeletonBlock }
