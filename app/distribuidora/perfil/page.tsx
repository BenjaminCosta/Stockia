'use client'

import { useRouter } from 'next/navigation'
import { Truck, MapPin, Phone, Mail, FileText, Bell, Shield, ChevronRight, LogOut, Edit, TrendingUp, Package, Users } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Distribuidora } from '@/lib/types'
import { Switch } from '@/components/ui/switch'
import { getProductsByDistribuidora, getOrdersByDistribuidora } from '@/lib/mock-data'

const notifications = [
  { label: 'Nuevos pedidos', sub: 'Recibí una alerta cuando entra un pedido nuevo', defaultOn: true },
  { label: 'Cambios de estado', sub: 'Confirmaciones de pago y actualizaciones de entrega', defaultOn: true },
  { label: 'Stock bajo', sub: 'Te avisamos cuando un producto queda con poco stock', defaultOn: true },
  { label: 'Novedades de Stockia', sub: 'Actualizaciones de la plataforma y nuevas funciones', defaultOn: false },
]

export default function PerfilDistribuidoraPage() {
  const router = useRouter()
  const { currentUser, logout } = useApp()
  const distribuidora = currentUser as Distribuidora | null

  const companyName = distribuidora?.companyName || 'Mi distribuidora'
  const initials = companyName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const city = distribuidora?.location?.city || 'Quilmes'

  const products = getProductsByDistribuidora(distribuidora?.id || 'dist-1')
  const orders = getOrdersByDistribuidora(distribuidora?.id || 'dist-1')
  const todaySales = orders.reduce((sum, o) => sum + o.total, 0)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const infoFields = [
    { icon: <Truck className="h-5 w-5" />, label: 'Nombre de fantasía', value: companyName },
    { icon: <FileText className="h-5 w-5" />, label: 'Razón Social', value: distribuidora?.companyName || 'Fernández Distribuciones S.A.' },
    { icon: <FileText className="h-5 w-5" />, label: 'CUIT', value: '30-71234567-4' },
    { icon: <MapPin className="h-5 w-5" />, label: 'Zona de cobertura', value: `${city} y alrededores` },
    { icon: <Phone className="h-5 w-5" />, label: 'Teléfono', value: distribuidora?.phone || '+54 11 4321-5678' },
    { icon: <Mail className="h-5 w-5" />, label: 'Email', value: distribuidora?.email || 'contacto@distribuidora.com' },
  ]

  const configFields = [
    { label: 'Pedido mínimo', value: '$15.000' },
    { label: 'Tiempo de entrega', value: '48 horas hábiles' },
    { label: 'Zonas de entrega', value: `${city} · Avellaneda · Lanús` },
    { label: 'Horario de pedidos', value: 'Lunes a Viernes · 8 a 17hs' },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dark hero header */}
      <div className="bg-[#111827] pt-8 pb-20 md:pb-24 px-4 md:px-8 relative md:rounded-b-3xl md:mt-4 md:mx-4 overflow-hidden shadow-lg">
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <circle cx="88%" cy="25%" r="90" fill="none" stroke="white" strokeWidth="5" />
          <rect x="3%" y="60%" width="80" height="80" fill="none" stroke="white" strokeWidth="4" transform="rotate(20)" />
        </svg>
        <div className="max-w-5xl mx-auto relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-4 md:gap-6">
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl md:rounded-3xl bg-primary flex items-center justify-center font-heading font-bold text-2xl md:text-3xl text-white shrink-0 border border-white/10 shadow-inner">
              {initials}
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl md:text-3xl text-white leading-tight">{companyName}</h1>
              <div className="flex items-center gap-1.5 text-white/70 text-sm md:text-base font-medium mt-2 bg-white/10 px-3 py-1 rounded-full w-max">
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
                  <div className="flex items-center justify-center gap-1 mb-1 md:hidden">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 md:mb-0 text-center md:text-left">Ventas</p>
                  <p className="font-heading font-bold text-xl md:text-2xl text-gray-900 text-center md:text-left">
                    ${todaySales.toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="px-4 md:px-0 md:py-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center justify-center gap-1 mb-1 md:hidden">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 md:mb-0 text-center md:text-left">Productos</p>
                  <p className="font-heading font-bold text-xl md:text-2xl text-gray-900 text-center md:text-left">{products.length}</p>
                </div>
                <div className="pl-4 md:pl-0 md:pt-4 flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="flex items-center justify-center gap-1 mb-1 md:hidden">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 md:mb-0 text-center md:text-left">Clientes</p>
                  <p className="font-heading font-bold text-xl md:text-2xl text-gray-900 text-center md:text-left">{orders.length}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-3xl shadow-sm border border-border divide-y divide-gray-100 overflow-hidden">
              <button className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-gray-500" />
                </div>
                <div className="flex-1">
                  <span className="block font-bold text-sm text-gray-900">Seguridad</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">Contraseña y acceso</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
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
            {/* Company info */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-6">Datos de la empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {infoFields.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                    <div className="h-10 w-10 rounded-xl bg-white shadow-sm text-primary flex items-center justify-center shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className="font-bold text-sm text-gray-900 truncate" title={item.value}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational config */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-6">Configuración operativa</h2>
              <div className="space-y-4">
                {configFields.map((item, i) => (
                  <div
                    key={i}
                    className={`flex flex-col md:flex-row md:justify-between md:items-center gap-1 md:gap-4 ${i !== 0 ? 'pt-4 border-t border-gray-100' : ''}`}
                  >
                    <p className="text-sm font-bold text-gray-500">{item.label}</p>
                    <div className="flex items-center gap-2 md:justify-end">
                      <p className="font-bold text-sm text-gray-900">{item.value}</p>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-3xl shadow-sm border border-border p-6 md:p-8">
              <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wider mb-6">Notificaciones</h2>
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
                        <p className="font-bold text-base text-gray-900">{item.label}</p>
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
