'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Truck,
  Store,
  ClipboardList,
  Receipt,
  Tag,
  Star,
  LogOut,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useApp } from '@/lib/app-context'
import { StockiaLogo } from '@/components/stockia-logo'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/distribuidoras', label: 'Distribuidoras', icon: Truck, exact: false },
  { href: '/admin/comercios', label: 'Comercios', icon: Store, exact: false },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList, exact: false },
  { href: '/admin/comisiones', label: 'Comisiones', icon: Receipt, exact: false },
  { href: '/admin/categorias', label: 'Categorías', icon: Tag, exact: false },
  { href: '/admin/ratings', label: 'Reseñas', icon: Star, exact: false },
]

function NavItem({ href, label, icon: Icon, exact, pathname }: {
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

export function AdminSidebar() {
  const pathname = usePathname()
  const { logout } = useApp()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-sidebar min-h-screen border-r border-white/5 fixed top-0 left-0 bottom-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <StockiaLogo variant="white" className="h-7 w-auto" />
        <div className="mt-2 flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#C8FF00]" />
          <span className="text-xs font-semibold text-[#C8FF00] uppercase tracking-widest">Panel Admin</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavItem key={item.href} {...item} pathname={pathname} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-5 border-t border-white/5 pt-4">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="h-8 w-8 rounded-xl bg-[rgba(200,255,0,0.15)] flex items-center justify-center text-[#C8FF00] font-bold text-xs shrink-0">
            SK
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">StockIA Admin</p>
            <p className="text-[11px] text-white/40 truncate">admin@stockia.app</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/90 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 group-hover:bg-red-500/10 shrink-0">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  )
}
