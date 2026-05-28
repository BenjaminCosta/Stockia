'use client'

import Link from 'next/link'
import { Bell, ChevronRight, Package, ShieldAlert, Star, Truck } from 'lucide-react'
import { ComercioPageHeader } from '@/components/comercio-page-header'
import { StatusBadge } from '@/components/status-badge'
import { useApp } from '@/lib/app-context'
import { useComercioOrders } from '@/hooks/use-data'
import type { Comercio, Order } from '@/lib/types'

const toneStyles = {
  neutral: 'border-border bg-white',
  positive: 'border-emerald-100 bg-emerald-50/50',
  warning: 'border-amber-100 bg-amber-50/60',
  critical: 'border-red-100 bg-red-50/70',
}

function buildNotification(order: Order) {
  const firestoreStatus = order.firestoreStatus ?? (
    order.status === 'entregado' ? 'delivered' :
    order.status === 'en_preparacion' ? 'preparing' :
    order.status === 'pagado' ? 'confirmed' :
    'pending_confirmation'
  )

  if (firestoreStatus === 'cancelled') {
    return {
      title: 'Pedido cancelado',
      description: `${order.distribuidoraName} cerró la operación como cancelada. Revisá el detalle para ver el motivo registrado.`,
      icon: ShieldAlert,
      tone: 'critical' as const,
    }
  }

  if (firestoreStatus === 'delivered') {
    return {
      title: 'Pedido entregado',
      description: `${order.distribuidoraName} marcó el pedido como entregado. Ya podés calificar la experiencia.`,
      icon: Star,
      tone: 'positive' as const,
    }
  }

  if (firestoreStatus === 'ready_or_on_the_way') {
    return {
      title: 'Pedido en camino',
      description: `${order.distribuidoraName} ya está coordinando la entrega o lo dejó listo para despacho.`,
      icon: Truck,
      tone: 'positive' as const,
    }
  }

  if (firestoreStatus === 'confirmed') {
    return {
      title: 'Pedido confirmado',
      description: `${order.distribuidoraName} aceptó tu pedido. Ya podés seguir su avance desde el detalle.`,
      icon: Package,
      tone: 'positive' as const,
    }
  }

  if (firestoreStatus === 'preparing') {
    return {
      title: 'Pedido en preparación',
      description: `${order.distribuidoraName} está armando tu compra.`,
      icon: Package,
      tone: 'neutral' as const,
    }
  }

  return {
    title: 'Pedido enviado',
    description: `Tu pedido quedó pendiente de confirmación por parte de ${order.distribuidoraName}.`,
    icon: Bell,
    tone: 'warning' as const,
  }
}

export default function ComercioNotificacionesPage() {
  const { currentUser } = useApp()
  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const { data: orders } = useComercioOrders(comercio?.id || 'com-1')

  const orderedNotifications = [...orders]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8)

  const activeOrders = orders.filter((order) => !['entregado'].includes(order.status)).length
  const deliveredOrders = orders.filter((order) => order.status === 'entregado').length
  const cancelledOrders = orders.filter((order) => ['cancelled', 'not_delivered'].includes(order.firestoreStatus ?? '')).length

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
      <div className="max-w-350 mx-auto px-4 py-6 md:px-8 md:py-8">
        <ComercioPageHeader label="Actividad" title="Notificaciones" />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {orderedNotifications.length === 0 ? (
            <div className="rounded-3xl border border-border bg-white px-6 py-12 text-center shadow-sm md:px-8">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1FFD1] text-[#0B1A45]">
                <Bell className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">Todavía no hay actividad</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Cuando empieces a enviar pedidos, acá vas a ver confirmaciones, avances de entrega y cierres recientes.
              </p>
              <Link
                href="/comercio/distribuidoras"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
              >
                Explorar distribuidoras
              </Link>
            </div>
          ) : (
            orderedNotifications.map((order) => {
              const notification = buildNotification(order)
              const Icon = notification.icon

              return (
                <Link
                  key={order.id}
                  href={`/comercio/pedidos/${order.id}`}
                  className={`block rounded-3xl border p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 ${toneStyles[notification.tone]}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0B1A45] text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-bold text-foreground">{notification.title}</p>
                        <StatusBadge status={order.firestoreStatus ?? order.status} />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{notification.description}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{order.orderNumber}</span>
                        <span>{new Date(order.updatedAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>{order.distribuidoraName}</span>
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                </Link>
              )
            })
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Resumen</p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-[#F7F8FA] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Pedidos activos</p>
                <p className="mt-1 text-2xl font-heading font-bold text-foreground">{activeOrders}</p>
              </div>
              <div className="rounded-2xl bg-[#F1FFD1] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#4A662E]">Entregados</p>
                <p className="mt-1 text-2xl font-heading font-bold text-[#0B1A45]">{deliveredOrders}</p>
              </div>
              <div className="rounded-2xl bg-red-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-500">Incidencias</p>
                <p className="mt-1 text-2xl font-heading font-bold text-foreground">{cancelledOrders}</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-[#0B1A45] p-6 text-white shadow-[0_18px_44px_rgba(11,26,69,0.22)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C8FF00]/75">Flujo comercio</p>
            <h3 className="mt-2 font-heading text-xl font-bold leading-tight">Las notificaciones viven alrededor del pedido</h3>
            <p className="mt-3 text-sm leading-6 text-white/70">
              Este centro resume la actividad reciente, pero el detalle completo sigue estando dentro de cada pedido para evitar ruido y mantener trazabilidad.
            </p>
          </div>
        </aside>
        </div>
      </div>
    </div>
  )
}
