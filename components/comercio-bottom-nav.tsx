'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, MoreHorizontal, ReceiptText, Search, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAS_PATHS = [
  '/comercio/mas',
  '/comercio/cuenta',
  '/comercio/carrito',
  '/comercio/ayuda',
  '/comercio/contacto',
  '/comercio/terminos',
  '/comercio/privacidad',
  '/comercio/como-funciona',
  '/comercio/empresa',
  '/comercio/notificaciones',
  '/comercio/seguridad',
  '/comercio/configuracion',
]

const navItems = [
  { href: '/comercio', label: 'Inicio', icon: House, exact: true, extraPaths: [] as string[] },
  { href: '/comercio/buscar', label: 'Buscar', icon: Search, exact: false, extraPaths: [] as string[] },
  { href: '/comercio/distribuidoras', label: 'Distrib.', icon: Store, exact: false, extraPaths: [] as string[] },
  { href: '/comercio/pedidos', label: 'Pedidos', icon: ReceiptText, exact: false, extraPaths: [] as string[] },
  { href: '/comercio/mas', label: 'Más', icon: MoreHorizontal, exact: false, extraPaths: MAS_PATHS },
]

export function ComercioBottomNav() {
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
              className="relative flex flex-1 flex-col items-center pt-1.5 pb-2 gap-0.5 transition-opacity duration-150 active:opacity-70"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2.5px] bg-[#C8FF00] rounded-b-full" />
              )}
              <Icon
                className={cn('h-5 w-5 transition-colors duration-150', isActive ? 'text-[#C8FF00]' : 'text-white/40')}
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
