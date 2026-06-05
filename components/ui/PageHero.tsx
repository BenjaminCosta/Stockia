import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InternalHeaderBackground } from '@/components/internal-header-background'

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
  contentClassName?: string
}

export function PageHero({
  label,
  title,
  subtitle,
  badge,
  backHref,
  children,
  className,
  contentClassName,
}: PageHeroProps) {
  return (
    <InternalHeaderBackground className={cn('px-4 md:px-8 pt-5 pb-10 md:pt-8', className)}>
      <div className={cn('relative z-10 max-w-350 mx-auto w-full', contentClassName)}>
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 mb-4 transition-colors text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}

        {label && (
          <p className="text-[#C8FF00]/60 text-[10px] md:text-xs font-bold uppercase tracking-[0.18em] mb-1.5">{label}</p>
        )}

        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-heading font-bold text-2xl md:text-4xl text-white leading-tight mb-1 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/55 text-xs md:text-sm font-medium">{subtitle}</p>
            )}
          </div>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>

        {children && <div className="mt-3 md:mt-4">{children}</div>}
      </div>
    </InternalHeaderBackground>
  )
}
