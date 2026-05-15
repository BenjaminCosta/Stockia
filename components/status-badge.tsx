import { AlertCircle, CheckCircle, Clock, Package, Truck, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  showIcon?: boolean
  className?: string
}

const statusConfig: Record<string, { label: string; icon: React.ElementType | null; className: string }> = {
  // Legacy local statuses
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  pagado: {
    label: 'Confirmado',
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
    icon: X,
    className: 'bg-red-50 text-red-600 border-red-200',
  },
  // Firestore statuses (used in distribuidora detail + admin)
  pending_confirmation: {
    label: 'Pend. confirmación',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  confirmed: {
    label: 'Confirmado',
    icon: CheckCircle,
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  preparing: {
    label: 'En preparación',
    icon: Package,
    className: 'bg-[#F1FFD1] text-[#4A662E] border-[#89B317]/30',
  },
  ready_or_on_the_way: {
    label: 'En camino',
    icon: Truck,
    className: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  delivered: {
    label: 'Entregado',
    icon: Truck,
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  cancelled: {
    label: 'Cancelado',
    icon: X,
    className: 'bg-red-50 text-red-600 border-red-200',
  },
  not_delivered: {
    label: 'No entregado',
    icon: AlertCircle,
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  // Other
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
