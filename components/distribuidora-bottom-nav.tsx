'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ClipboardList, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/distribuidora', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/distribuidora/productos', label: 'Productos', icon: Package },
  { href: '/distribuidora/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/distribuidora/perfil', label: 'Perfil', icon: User },
]

export function DistribuidoraBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/distribuidora' && pathname.startsWith(href))
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
