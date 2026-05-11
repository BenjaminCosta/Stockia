'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, Home, Search, Truck, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/comercio', label: 'Inicio', icon: Home, exact: true },
  { href: '/comercio/distribuidoras', label: 'Distrib.', icon: Truck, exact: false },
  { href: '/comercio/buscar', label: 'Buscar', icon: Search, exact: false },
  { href: '/comercio/pedidos', label: 'Pedidos', icon: ClipboardList, exact: false },
  { href: '/comercio/cuenta', label: 'Cuenta', icon: User, exact: false },
]

export function ComercioBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const { href, label, icon: Icon } = item
          const isActive = item.exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
