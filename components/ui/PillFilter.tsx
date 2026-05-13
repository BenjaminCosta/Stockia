'use client'

import { cn } from '@/lib/utils'

interface PillFilterItem<T extends string> {
  value: T
  label: string
}

interface PillFilterProps<T extends string> {
  items: PillFilterItem<T>[]
  selected: T
  onChange: (value: T) => void
  className?: string
}

export function PillFilter<T extends string>({ items, selected, onChange, className }: PillFilterProps<T>) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1 scrollbar-hide', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all',
            selected === item.value
              ? 'bg-[#0B1A45] text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-primary/50 hover:text-primary'
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
