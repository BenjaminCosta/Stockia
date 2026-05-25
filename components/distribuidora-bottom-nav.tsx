'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChartNoAxesColumnIncreasing, House, MoreHorizontal, Package, ReceiptText } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAS_PATHS = ['/distribuidora/mas', '/distribuidora/zonas', '/distribuidora/resenas', '/distribuidora/perfil']

const navItems = [
  { href: '/distribuidora', label: 'Inicio', icon: House, exact: true, extraPaths: [] as string[] },
  { href: '/distribuidora/pedidos', label: 'Pedidos', icon: ReceiptText, exact: false, extraPaths: [] as string[] },
  { href: '/distribuidora/productos', label: 'Productos', icon: Package, exact: false, extraPaths: [] as string[] },
  { href: '/distribuidora/ventas', label: 'Ventas', icon: ChartNoAxesColumnIncreasing, exact: false, extraPaths: [] as string[] },
  { href: '/distribuidora/mas', label: 'Más', icon: MoreHorizontal, exact: false, extraPaths: MAS_PATHS },
]

export function DistribuidoraBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <div className="flex bg-sidebar border-t border-white/8 rounded-t-[20px] overflow-hidden shadow-[0_-4px_20px_rgba(11,26,69,0.3)] pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const { href, label, icon: Icon, extraPaths } = item
          const isActive = item.exact
            ? pathname === href
            : pathname === href ||
              pathname.startsWith(href + '/') ||
              extraPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center pt-2.5 pb-3 gap-0.5 active:opacity-70 transition-opacity duration-100"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-[#C8FF00] rounded-b-full" />
              )}
              <Icon
                className={cn('h-5.5 w-5.5 transition-colors duration-150', isActive ? 'text-[#C8FF00]' : 'text-white/40')}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span className={cn('text-[9px] font-semibold tracking-wide transition-colors duration-150', isActive ? 'text-[#C8FF00]' : 'text-white/40')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
