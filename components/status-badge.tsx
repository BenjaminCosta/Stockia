import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pendiente: {
    label: 'Pendiente',
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  pagado: {
    label: 'Pagado',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  en_preparacion: {
    label: 'En preparación',
    className: 'bg-red-50 text-primary border-red-200',
  },
  entregado: {
    label: 'Entregado',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
