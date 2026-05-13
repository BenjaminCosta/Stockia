import Image from 'next/image'
import { cn } from '@/lib/utils'

type StockiaLogoProps = {
  size?: number
  className?: string
  /**
   * 'white' = logo blanco+lima → para fondos oscuros (sidebar navy, login panel)
   * 'navy'  = logo navy+lima → para fondos claros (header blanco)
   * 'icon'  = isotipo (default) → icono compacto, cualquier fondo
   */
  variant?: 'navy' | 'white' | 'icon'
}

export function StockiaLogo({ size = 40, className, variant = 'icon' }: StockiaLogoProps) {
  if (variant === 'white') {
    return (
      <Image
        src="/logo-white.png"
        alt="Stockia"
        width={Math.round(size * 4)}
        height={size}
        priority
        className={cn('object-contain', className)}
      />
    )
  }

  if (variant === 'navy') {
    return (
      <Image
        src="/logo-navy.svg"
        alt="Stockia"
        width={Math.round(size * 4)}
        height={size}
        priority
        className={cn('object-contain', className)}
      />
    )
  }

  // 'icon' — isotipo compacto (default)
  return (
    <Image
      src="/logo-iso.svg"
      alt="Stockia"
      width={size}
      height={size}
      priority
      className={cn('object-contain', className)}
    />
  )
}
