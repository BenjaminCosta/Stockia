import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: React.ElementType
  title: string
  description?: string
  actionLabel?: string
  actionHref?: string
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center text-center py-16 px-6',
      'bg-white rounded-3xl border border-[#DFE1E8]/80',
      'shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.04)]',
      className
    )}>
      {/* Icon well — layered rings for depth */}
      <div className="relative mb-5">
        <div className="h-16 w-16 bg-[#F7F8FA] border border-[#DFE1E8]/80 rounded-2xl flex items-center justify-center shadow-[0_1px_4px_rgba(11,26,69,0.06)] mx-auto">
          <Icon className="h-7 w-7 text-[#7A839C]" />
        </div>
      </div>
      <h3 className="font-heading font-bold text-foreground text-base md:text-lg">{title}</h3>
      {description && (
        <p className="text-[#7A839C] text-sm mt-1.5 max-w-xs leading-relaxed">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-6 inline-flex items-center px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 active:scale-[0.97] transition-[transform,background-color] duration-150"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
