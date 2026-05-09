import * as React from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { VariantProps } from 'class-variance-authority'

type LoadingButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    loading?: boolean
    loadingLabel?: string
  }

export function LoadingButton({
  children,
  loading = false,
  loadingLabel = 'Cargando',
  disabled,
  className,
  type = 'button',
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      type={type}
      className={cn('relative', className)}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      <span className={cn('flex items-center justify-center gap-2 transition-opacity', loading && 'opacity-0')}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 animate-stockia-dot rounded-full bg-current [animation-delay:-160ms]" />
            <span className="h-1.5 w-1.5 animate-stockia-dot rounded-full bg-current [animation-delay:-80ms]" />
            <span className="h-1.5 w-1.5 animate-stockia-dot rounded-full bg-current" />
          </span>
        </span>
      )}
      {loading && <span className="sr-only">{loadingLabel}</span>}
    </Button>
  )
}
