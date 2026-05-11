'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ClipboardList, Home, LogOut, Search, User, Truck } from 'lucide-react'
import { StockiaLogo } from '@/components/stockia-logo'
import { useApp } from '@/lib/app-context'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/comercio', label: 'Inicio', icon: Home, exact: true },
  { href: '/comercio/distribuidoras', label: 'Distribuidoras', icon: Truck, exact: false },
  { href: '/comercio/buscar', label: 'Buscar', icon: Search, exact: false },
  { href: '/comercio/pedidos', label: 'Mis pedidos', icon: ClipboardList, exact: false },
  { href: '/comercio/cuenta', label: 'Cuenta', icon: User, exact: false },
]

export function ComercioSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, currentUser } = useApp()
  const comercio = currentUser as { storeName?: string } | null
  const storeName = comercio?.storeName || 'Mi comercio'
  const initials = storeName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 flex-col bg-sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/comercio" className="flex items-center gap-2.5">
          <StockiaLogo size={40} />
          <div>
            <span className="font-heading text-xl font-bold text-white">Stockia</span>
            <p className="text-sidebar-foreground/50 text-xs mt-0.5">Portal Comercios</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-4 space-y-1">
        {navItems.map((item) => {
          const { href, label, icon: Icon } = item
          const isActive = item.exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-white font-medium'
                  : 'text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-4 py-2 hover:bg-sidebar-accent rounded-md transition-colors mb-1">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs shrink-0">
            {initials}
          </div>
          <div className="text-sm min-w-0">
            <p className="font-medium text-white truncate">{storeName}</p>
            <p className="text-sidebar-foreground/50 text-xs">Comercio</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 w-full rounded-md text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
