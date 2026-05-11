'use client'

import { useRouter } from 'next/navigation'
import { Store, MapPin, Phone, Mail, FileText, Bell, Shield, ChevronRight, LogOut, Edit, Settings } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Comercio } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { mockOrders } from '@/lib/mock-data'

// Notifications config is static UI — no mock data needed

const notifications = [
  { label: 'Actualizaciones de pedidos', sub: 'Recibí notificaciones cuando cambia el estado de un pedido', defaultOn: true },
  { label: 'Nuevas distribuidoras', sub: 'Te avisamos cuando llega una nueva distribuidora a tu zona', defaultOn: true },
  { label: 'Ofertas y promociones', sub: 'Descuentos y novedades de tus distribuidoras favoritas', defaultOn: false },
]

export default function CuentaPage() {
  const router = useRouter()
  const { currentUser, logout } = useApp()
  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null

  const storeName = comercio?.storeName || 'Mi comercio'
  const initials = storeName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const city = comercio?.location?.city || 'Avellaneda'
  const zone = comercio?.location?.zone || 'Centro'

  const myOrders = mockOrders.filter(o => o.comercioId === (comercio?.id || 'com-1'))
  const uniqueDistributors = new Set(myOrders.map(o => o.distribuidoraId)).size

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const infoFields = [
    { icon: <Store className="h-5 w-5" />, label: 'Nombre de fantasía', value: storeName },
    { icon: <FileText className="h-5 w-5" />, label: 'Razón Social', value: comercio?.razonSocial || 'García, Roberto Marcelo' },
    { icon: <FileText className="h-5 w-5" />, label: 'CUIT', value: comercio?.cuit || '—' },
    { icon: <MapPin className="h-5 w-5" />, label: 'Zona', value: `${city}, ${zone}` },
    { icon: <Phone className="h-5 w-5" />, label: 'Teléfono', value: comercio?.phone || '+54 11 4567-8901' },
    { icon: <Mail className="h-5 w-5" />, label: 'Email', value: comercio?.email || 'email@example.com' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dark hero header */}
      <div className="bg-sidebar pt-8 pb-20 md:pb-24 px-4 md:px-8 relative md:rounded-b-3xl md:mt-4 md:mx-4 overflow-hidden shadow-lg">
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <circle cx="90%" cy="20%" r="80" fill="none" stroke="white" strokeWidth="5" />
          <rect x="5%" y="65%" width="70" height="70" fill="none" stroke="white" strokeWidth="4" transform="rotate(15)" />
        </svg>
        <div className="max-w-5xl mx-auto relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="h-16 w-16 md:h-24 md:w-24 rounded-2xl md:rounded-3xl bg-primary flex items-center justify-center font-heading font-bold text-2xl md:text-4xl text-white shrink-0 shadow-inner border border-white/10">
              {initials}
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl md:text-3xl text-white leading-tight">{storeName}</h1>
              <div className="flex items-center gap-1.5 text-white/70 text-sm md:text-base mt-2 font-medium bg-white/10 px-3 py-1 rounded-full w-max">
                <MapPin className="h-3.5 w-3.5" /> {city}, Buenos Aires
              </div>
            </div>
          </div>
          <button className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors border border-white/10">
            <Edit className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Floating content */}
      <div className="px-4 md:px-8 -mt-8 md:-mt-12 relative z-10 pb-12 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Left column */}
          <div className="md:col-span-4 space-y-6">
            {/* Stats card */}
            <div className="bg-white rounded-3xl shadow-md border border-border p-6">
              <div className="grid grid-cols-3 md:grid-cols-1 md:divide-y divide-x md:divide-x-0 divide-gray-100">
                <div className="pr-4 md:pr-0 md:pb-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 md:mb-0 text-center md:text-left">Pedidos</p>
                  <p className="font-heading font-bold text-3xl md:text-2xl text-foreground text-center md:text-left">{myOrders.length}</p>
                </div>
                <div className="px-4 md:px-0 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 md:mb-0 text-center md:text-left">Proveedores</p>
                  <p className="font-heading font-bold text-3xl md:text-2xl text-foreground text-center md:text-left">{uniqueDistributors}</p>
                </div>
                <div className="pl-4 md:pl-0 md:pt-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 md:mb-0 text-center md:text-left">Calificación</p>
                  <p className="font-heading font-bold text-3xl md:text-2xl text-primary text-center md:text-left">4.9</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-3xl shadow-sm border border-border divide-y divide-gray-100 overflow-hidden">
              <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Store className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-foreground">Perfil comercio</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Nombre, logo y datos de negocio</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-foreground">Ubicación</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Dirección y zona de entrega</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Phone className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-foreground">Datos de contacto</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Teléfono, email y WhatsApp</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-foreground">Seguridad</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Contraseña y acceso</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Settings className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-foreground">Configuración</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Preferencias y notificaciones</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-red-50 transition-colors group"
              >
                <div className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-100 transition-colors">
                  <LogOut className="h-5 w-5 text-red-600" />
                </div>
                <span className="flex-1 font-bold text-sm text-red-600">Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-8 space-y-6">
            {/* Business info */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Datos del negocio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {infoFields.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm text-primary flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="font-bold text-sm text-foreground truncate" title={item.value}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Notificaciones</h2>
              <div className="space-y-6">
                {notifications.map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-4 ${i !== 0 ? 'pt-6 border-t border-gray-100' : ''}`}
                  >
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-xl bg-gray-50 items-center justify-center shrink-0 hidden md:flex">
                        <Bell className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-bold text-base text-foreground">{item.label}</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-md">{item.sub}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={item.defaultOn} className="data-[state=checked]:bg-primary shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
