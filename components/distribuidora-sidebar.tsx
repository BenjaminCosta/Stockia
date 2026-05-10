'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ClipboardList, User, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/app-context'
import { StockiaLogo } from '@/components/stockia-logo'

const navItems = [
  { href: '/distribuidora', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/distribuidora/productos', label: 'Productos', icon: Package },
  { href: '/distribuidora/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/distribuidora/perfil', label: 'Perfil', icon: User },
]

export function DistribuidoraSidebar() {
  const pathname = usePathname()
  const { logout, currentUser } = useApp()
  const router = useRouter()

  const distribuidora = currentUser as { companyName?: string } | null
  const companyName = distribuidora?.companyName || 'Mi distribuidora'
  const initials = companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-sidebar">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <Link href="/distribuidora" className="flex items-center gap-2.5">
          <StockiaLogo size={40} />
          <div>
            <span className="font-heading text-xl font-bold text-white">Stockia</span>
            <p className="text-sidebar-foreground/50 text-xs mt-0.5">Portal Distribuidora</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/distribuidora' && pathname.startsWith(href))
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
            <p className="font-medium text-white truncate">{companyName}</p>
            <p className="text-sidebar-foreground/50 text-xs">Admin</p>
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
