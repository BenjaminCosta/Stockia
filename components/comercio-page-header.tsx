import Link from 'next/link'
import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'

type ComercioPageHeaderProps = {
  label: string
  title: string
  backHref?: string
  actions?: ReactNode
}

export function ComercioPageHeader({
  label,
  title,
  backHref = '/comercio',
  actions,
}: ComercioPageHeaderProps) {
  return (
    <header className="mb-5 flex items-center gap-4 md:mb-6">
      <Link
        href={backHref}
        className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white border border-[#DFE1E8] flex items-center justify-center text-[#0B1A45] hover:bg-gray-50 transition-colors active:scale-95 shadow-sm"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <h1 className="mt-0.5 truncate font-heading text-xl font-bold tracking-tight text-[#0B1A45] md:text-3xl">
          {title}
        </h1>
      </div>
      {actions}
    </header>
  )
}