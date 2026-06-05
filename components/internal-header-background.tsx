import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type InternalHeaderBackgroundProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section'
}

export function InternalHeaderBackground({
  as = 'div',
  className,
  ...props
}: InternalHeaderBackgroundProps) {
  const Component = as

  return (
    <Component
      className={cn('stockia-internal-header-bg relative overflow-hidden', className)}
      {...props}
    />
  )
}
