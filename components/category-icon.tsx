'use client'

import {
  BadgeIcon,
  Boxes,
  Milk,
  Package,
  Snowflake,
  Sparkles,
  Wheat,
  Wine,
} from 'lucide-react'
import { categories } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const icons = {
  badge: BadgeIcon,
  bottle: Wine,
  boxes: Boxes,
  milk: Milk,
  package: Package,
  snowflake: Snowflake,
  sparkles: Sparkles,
  wheat: Wheat,
}

type CategoryIconProps = {
  category: string
  className?: string
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const iconName = categories.find((item) => item.name === category)?.iconName
  const Icon = icons[(iconName || 'package') as keyof typeof icons]

  return <Icon className={cn('h-5 w-5', className)} />
}
