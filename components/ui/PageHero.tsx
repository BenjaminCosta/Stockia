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
    <div className={cn('bg-[#080f2b] px-4 md:px-8 pt-5 pb-10 md:pt-8 relative overflow-hidden', className)}>
      {/* Layered decorative background */}

      {/* Radial glow — top left */}
      <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#0B1A45] blur-3xl opacity-80 pointer-events-none" />
      {/* Radial glow — bottom right */}
      <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-[#0B1A45]/60 blur-2xl pointer-events-none" />
      {/* Lima accent glow — very subtle */}
      <div className="absolute top-0 right-1/4 h-32 w-32 rounded-full bg-[#C8FF00]/4 blur-3xl pointer-events-none" />

      {/* Geometric SVG overlay */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        {/* Large ring — top right */}
        <circle cx="92%" cy="-10%" r="38%" fill="none" stroke="white" strokeWidth="32" />
        {/* Medium ring — bottom left */}
        <circle cx="8%" cy="110%" r="22%" fill="none" stroke="white" strokeWidth="20" />
        {/* Diagonal route line */}
        <line x1="0" y1="100%" x2="100%" y2="0" stroke="white" strokeWidth="0.8" opacity="0.6" />
        <line x1="0" y1="70%" x2="70%" y2="0" stroke="white" strokeWidth="0.5" opacity="0.4" />
        {/* Small dot grid — top-left quadrant */}
        <circle cx="15%" cy="30%" r="1.5" fill="white" opacity="0.5" />
        <circle cx="22%" cy="55%" r="1" fill="white" opacity="0.3" />
        <circle cx="35%" cy="20%" r="1" fill="white" opacity="0.3" />
      </svg>

      {/* Subtle dot mesh */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle,rgba(255,255,255,1)_1px,transparent_1px)] bg-size-[18px_18px] pointer-events-none" />

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
    </div>
  )
}
