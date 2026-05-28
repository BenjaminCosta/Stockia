import { CreditCard, Handshake, HelpCircle } from 'lucide-react'
import type { Order } from '@/lib/types'
import { cn } from '@/lib/utils'

type PaymentMethod = Order['paymentMethod']

export function getPaymentMethodConfig(method?: PaymentMethod) {
  if (method === 'mercado_pago') {
    return {
      label: 'Mercado Pago',
      detail: 'Saldo, tarjeta o QR',
      icon: CreditCard,
      className: 'bg-[#009EE3] text-white',
    }
  }

  if (method === 'external') {
    return {
      label: 'Pago externo',
      detail: 'Efectivo, transferencia o cuenta corriente',
      icon: Handshake,
      className: 'bg-amber-500 text-white',
    }
  }

  return {
    label: 'Pago a definir',
    detail: 'Sin método registrado',
    icon: HelpCircle,
    className: 'bg-slate-500 text-white',
  }
}

interface PaymentMethodBadgeProps {
  method?: PaymentMethod
  className?: string
  labelOverride?: string
}

export function PaymentMethodBadge({ method, className, labelOverride }: PaymentMethodBadgeProps) {
  const config = getPaymentMethodConfig(method)
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.08)]',
        config.className,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {labelOverride ?? config.label}
    </span>
  )
}