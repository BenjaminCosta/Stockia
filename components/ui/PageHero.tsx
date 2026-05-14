import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeroProps {
  /** Etiqueta pequeña uppercase sobre el título */
  label?: string
  title: string
  subtitle?: string
  /** Elemento extra junto al título (ej. badge de pendientes) */
  badge?: React.ReactNode
  /** Si se pasa, muestra botón back con ArrowLeft */
  backHref?: string
  /** Slot para botones de acción adicionales (se renderizan abajo del título) */
  children?: React.ReactNode
  className?: string
}

export function PageHero({
  label,
  title,
  subtitle,
  badge,
  backHref,
  children,
  className,
}: PageHeroProps) {
  return (
    <div className={cn('bg-[#0B1A45] px-4 md:px-8 pt-5 pb-10 md:pt-8 relative overflow-hidden', className)}>
      {/* Decorative SVG circle */}
      <svg className="absolute right-0 top-0 h-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100%" cy="0" r="40%" fill="none" stroke="white" strokeWidth="40" />
      </svg>

      <div className="relative z-10">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 mb-4 transition-colors text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}

        {label && (
          <p className="text-white/50 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-0.5">{label}</p>
        )}

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-2xl md:text-4xl text-white leading-tight mb-1">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/60 text-xs md:text-sm font-medium">{subtitle}</p>
            )}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {children && <div className="mt-3 md:mt-4">{children}</div>}
      </div>
    </div>
  )
}
