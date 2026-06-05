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
    <div
      className="min-h-[100dvh] bg-[linear-gradient(180deg,#f8f9fb_0%,#ffffff_48%,#f6f8fb_100%)]"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-350 items-center justify-center px-4 py-10">
        <div className="relative flex w-full max-w-72 flex-col items-center text-center">
          <div className="relative mb-7 flex h-38 w-38 items-center justify-center sm:h-42 sm:w-42">
            <span className="absolute inset-8 rounded-full bg-[#C8FF00]/18 blur-2xl" aria-hidden="true" />
            <img
              src="/assets/validate-icon.png"
              alt=""
              className="relative h-full w-full object-contain drop-shadow-[0_22px_34px_rgba(11,26,69,0.14)] animate-stockia-session-float"
              aria-hidden="true"
            />
          </div>

          <h1 className="font-heading text-xl font-bold tracking-tight text-[#0B1A45] sm:text-2xl">
            {label}
          </h1>

          <div className="mt-5 flex h-5 items-center justify-center gap-2" aria-hidden="true">
            <span className="h-2 w-8 rounded-full bg-[#0B1A45] animate-stockia-session-bar [animation-delay:-220ms]" />
            <span className="h-2 w-8 rounded-full bg-[#C8FF00] animate-stockia-session-bar [animation-delay:-110ms]" />
            <span className="h-2 w-8 rounded-full bg-[#0B1A45] animate-stockia-session-bar" />
          </div>
        </div>
      </div>
    </div>
  )
}
