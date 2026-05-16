'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Package, ClipboardList, User, LogOut, MapPin, TrendingUp, Star, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/app-context'
import { StockiaLogo } from '@/components/stockia-logo'

const operationItems = [
  { href: '/distribuidora', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/distribuidora/pedidos', label: 'Pedidos', icon: ClipboardList, exact: false },
  { href: '/distribuidora/productos', label: 'Productos', icon: Package, exact: false },
  { href: '/distribuidora/zonas', label: 'Zonas de entrega', icon: MapPin, exact: false },
  { href: '/distribuidora/ventas', label: 'Ventas', icon: TrendingUp, exact: false },
  { href: '/distribuidora/resenas', label: 'Reseñas', icon: Star, exact: false },
]

const accountItems = [
  { href: '/distribuidora/perfil', label: 'Cuenta', icon: User, exact: false },
]

function SidebarItem({ href, label, icon: Icon, exact, pathname }: {
  href: string; label: string; icon: React.ElementType; exact: boolean; pathname: string
}) {
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group',
        isActive
          ? 'bg-[rgba(200,255,0,0.1)] text-[#C8FF00]'
          : 'text-white/90 hover:text-white hover:bg-white/5'
      )}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[#C8FF00] rounded-r-full" />
      )}
      <div className={cn(
        'flex h-8 w-8 items-center justify-center rounded-xl shrink-0 transition-all',
        isActive ? 'bg-[rgba(200,255,0,0.15)]' : 'bg-white/5 group-hover:bg-white/10'
      )}>
        <Icon className="h-4 w-4" />
      </div>
      <span className={cn('text-sm font-medium', isActive && 'font-semibold')}>{label}</span>
    </Link>
  )
}

export function DistribuidoraSidebar() {
  const pathname = usePathname()
  const { logout, currentUser } = useApp()
  const router = useRouter()

  const distribuidora = currentUser as { companyName?: string } | null
  const companyName = distribuidora?.companyName || 'Mi distribuidora'
  const initials = companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-[#080f2b]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <StockiaLogo variant="white" className="h-7 w-auto" />
        <div className="mt-2 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#C8FF00]" />
          <span className="text-xs font-semibold text-[#C8FF00] uppercase tracking-widest">Panel Distribuidora</span>
        </div>
      </div>
      

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <div>
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Operación</p>
          <div className="space-y-0.5">
            {operationItems.map((item) => (
              <SidebarItem key={item.href} {...item} pathname={pathname} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Cuenta</p>
          <div className="space-y-0.5">
            {accountItems.map((item) => (
              <SidebarItem key={item.href} {...item} pathname={pathname} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/8">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-white/90 hover:text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5">
            <LogOut className="h-4 w-4" />
          </div>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
