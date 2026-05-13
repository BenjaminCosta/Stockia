import { AlertCircle, CheckCircle, Clock, Package, Truck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  showIcon?: boolean
  className?: string
}

const statusConfig: Record<string, { label: string; icon: React.ElementType | null; className: string }> = {
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  pagado: {
    label: 'Pagado',
    icon: CheckCircle,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  en_preparacion: {
    label: 'En preparación',
    icon: Package,
    className: 'bg-[#F1FFD1] text-[#4A662E] border-[#89B317]/30',
  },
  entregado: {
    label: 'Entregado',
    icon: Truck,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelado: {
    label: 'Cancelado',
    icon: AlertCircle,
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
  abierto: {
    label: 'Abierto',
    icon: null,
    className: 'bg-[#F1FFD1] text-[#4A662E] border-[#89B317]/30',
  },
  activo: {
    label: 'Activo',
    icon: null,
    className: 'bg-[#F1FFD1] text-[#4A662E] border-[#89B317]/30',
  },
}

export function StatusBadge({ status, showIcon = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status,
    icon: null,
    className: 'bg-muted text-muted-foreground border-border',
  }
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
        config.className,
        className
      )}
    >
      {showIcon && Icon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  )
}
