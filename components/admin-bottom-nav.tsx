'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Truck, Store, ClipboardList, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAS_PATHS = ['/admin/mas', '/admin/comisiones', '/admin/categorias', '/admin/ratings']

const navItems = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard, exact: true, extraPaths: [] as string[] },
  { href: '/admin/distribuidoras', label: 'Distrib.', icon: Truck, exact: false, extraPaths: [] as string[] },
  { href: '/admin/comercios', label: 'Comercios', icon: Store, exact: false, extraPaths: [] as string[] },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList, exact: false, extraPaths: [] as string[] },
  { href: '/admin/mas', label: 'Más', icon: MoreHorizontal, exact: false, extraPaths: MAS_PATHS },
]

export function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="flex bg-[#0B1A45] border-t border-white/8 rounded-t-[20px] overflow-hidden shadow-[0_-4px_20px_rgba(11,26,69,0.3)] pb-[env(safe-area-inset-bottom)]">
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
              className="relative flex flex-1 flex-col items-center pt-2.5 pb-3 gap-0.5"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-[#C8FF00] rounded-b-[3px]" />
              )}
              <Icon
                className={cn('h-[22px] w-[22px]', isActive ? 'text-[#C8FF00]' : 'text-gray-200')}
                strokeWidth={1.75}
              />
              <span className={cn('text-[9px] font-semibold tracking-wide', isActive ? 'text-[#C8FF00]' : 'text-gray-200')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
