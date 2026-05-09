import Image from 'next/image'
import { cn } from '@/lib/utils'

type StockiaLogoProps = {
  size?: number
  className?: string
}

export function StockiaLogo({ size = 40, className }: StockiaLogoProps) {
  return (
    <Image
      src="/logo-S.png"
      alt="Stockia"
      width={size}
      height={size}
      priority
      className={cn('rounded-lg object-contain', className)}
    />
  )
}
