import { cn } from '@/lib/utils'

interface InitialsAvatarProps {
  initials: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'navy' | 'gray' | 'green'
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 rounded-full text-xs',
  md: 'h-11 w-11 rounded-full text-sm',
  lg: 'h-12 w-12 rounded-full text-sm',
}

const variantClasses = {
  navy: 'bg-[#0B1A45] text-[#C8FF00]',
  gray: 'bg-gray-100 text-gray-500',
  green: 'bg-[#C8FF00] text-[#0B1A45]',
}

export function InitialsAvatar({ initials, size = 'md', variant = 'navy', className }: InitialsAvatarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center font-bold shrink-0',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      {initials}
    </div>
  )
}
