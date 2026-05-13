'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sun, ClipboardList, Package, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/distribuidora', label: 'Hoy', icon: Sun, exact: true },
  { href: '/distribuidora/pedidos', label: 'Pedidos', icon: ClipboardList, exact: false },
  { href: '/distribuidora/productos', label: 'Productos', icon: Package, exact: false },
  { href: '/distribuidora/perfil', label: 'Cuenta', icon: User, exact: false },
]

export function DistribuidoraBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="flex bg-[#0B1A45] border-t border-white/8 rounded-t-[20px] overflow-hidden shadow-[0_-4px_20px_rgba(11,26,69,0.3)]">
        {navItems.map((item) => {
          const { href, label, icon: Icon } = item
          const isActive = item.exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center pt-2.5 pb-2 gap-1"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#C8FF00] rounded-b-[3px]" />
              )}
              <Icon className={cn('h-[22px] w-[22px]', isActive ? 'text-[#C8FF00]' : 'text-white/35')} strokeWidth={1.75} />
              <span className={cn('text-[9px] font-semibold tracking-wide', isActive ? 'text-[#C8FF00]' : 'text-white/35')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
