import { PackageSearch } from 'lucide-react'
import { cn } from '@/lib/utils'

type StockiaLoaderProps = {
  label?: string
  className?: string
}

export function StockiaLoader({ label = 'Preparando StockIA', className }: StockiaLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 text-center', className)} aria-busy="true">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inset-0 rounded-[1.75rem] bg-[#0B1A45]/[0.06]" />
        <span className="absolute inset-1 rounded-[1.55rem] border border-[#0B1A45]/10 bg-white shadow-[0_16px_40px_rgba(8,15,43,0.10)]" />
        <span className="absolute inset-0 rounded-[1.75rem] border border-[#C8FF00]/50 opacity-70 animate-stockia-loader-ring" />
        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1FFD1] text-[#0B1A45] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
          <PackageSearch className="h-6 w-6" strokeWidth={1.8} />
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-bold text-[#0B1A45]">{label}</p>
        <div className="mx-auto flex justify-center gap-1.5 text-[#0B1A45]" aria-hidden="true">
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot [animation-delay:-160ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot [animation-delay:-80ms]" />
          <span className="h-1.5 w-1.5 rounded-full bg-current animate-stockia-dot" />
        </div>
      </div>
    </div>
  )
}

export function FullPageLoadingState({ label = 'Cargando tu comercio' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f8fa_0%,#ffffff_52%,#f3f4f6_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-350 items-center justify-center px-4">
        <StockiaLoader label={label} />
      </div>
    </div>
  )
}
