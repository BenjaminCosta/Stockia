'use client'

import { use, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle, ArrowLeft, Check, Clock,
  Handshake, MapPin, Phone, Star,
} from 'lucide-react'
import { PaymentMethodBadge, getPaymentMethodConfig } from '@/components/payment-method-badge'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency } from '@/lib/mock-data'
import { useDistributor, useOrder } from '@/hooks/use-data'
import { getReviewByOrder } from '@/lib/data/reviews.service'
import { updateOrderStatus, type OrderStatus as FirestoreOrderStatus } from '@/lib/data/orders.service'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { OrderDetailSkeleton } from '@/components/ui/SkeletonCard'
import { cn } from '@/lib/utils'

// ─── Status timeline ───────────────────────────────────────────────────────────

const statusSteps: Array<{ key: FirestoreOrderStatus; label: string; description: string }> = [
  { key: 'pending_confirmation', label: 'Pedido enviado',       description: 'Esperando respuesta de la distribuidora' },
  { key: 'confirmed',           label: 'Confirmado',            description: 'La distribuidora aceptó el pedido' },
  { key: 'preparing',           label: 'En preparación',        description: 'Armando tu pedido en el depósito' },
  { key: 'ready_or_on_the_way', label: 'En camino',             description: 'El pedido salió hacia tu comercio' },
  { key: 'delivered',           label: 'Entregado',             description: 'Pedido recibido correctamente' },
]

const statusOrder: FirestoreOrderStatus[] = [
  'pending_confirmation', 'confirmed', 'preparing', 'ready_or_on_the_way', 'delivered',
]

function getStepStatus(current: FirestoreOrderStatus, step: FirestoreOrderStatus) {
  const ci = statusOrder.indexOf(current)
  const si = statusOrder.indexOf(step)
  if (si < ci) return 'completed'
  if (si === ci) return 'current'
  return 'upcoming'
}

// ─── Detail component ──────────────────────────────────────────────────────────

function PedidoDetail({ id }: { id: string }) {
  const { data: order, loading } = useOrder(id)
  const { data: distribuidora } = useDistributor(order?.distribuidoraId || '')
  const [hasReview, setHasReview] = useState<boolean | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const prevFSStatus = useRef<string | null>(null)

  useEffect(() => {
    if (order?.status === 'entregado') {
      getReviewByOrder(id).then(r => setHasReview(!!r))
    }
  }, [id, order?.status])

  // Detect real-time status changes via onSnapshot and notify the user
  useEffect(() => {
    if (!order?.firestoreStatus) return
    const current = order.firestoreStatus
    if (prevFSStatus.current !== null && prevFSStatus.current !== current) {
      const STATUS_CHANGE_LABELS: Record<string, string> = {
        confirmed:           '✓ La distribuidora confirmó tu pedido',
        preparing:           'Tu pedido está en preparación',
        ready_or_on_the_way: 'Tu pedido está en camino',
        delivered:           '¡Tu pedido fue entregado!',
        cancelled:           'El pedido fue cancelado',
        not_delivered:       'El pedido no pudo ser entregado',
      }
      const msg = STATUS_CHANGE_LABELS[current]
      if (msg) setActionMessage(msg)
    }
    prevFSStatus.current = current
  }, [order?.firestoreStatus])

  useEffect(() => {
    if (!actionMessage) return
    const t = window.setTimeout(() => setActionMessage(null), 4000)
    return () => window.clearTimeout(t)
  }, [actionMessage])

  if (loading) {
    return <OrderDetailSkeleton />
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 p-6">
        <p className="text-muted-foreground font-medium">Pedido no encontrado</p>
        <Link href="/comercio/pedidos" className="text-primary font-semibold hover:underline text-sm">
          Volver a mis pedidos
        </Link>
      </div>
    )
  }

  const isExternal = order.paymentMethod === 'external'
  const firestoreStatus = (order.firestoreStatus ?? (
    order.status === 'entregado'      ? 'delivered'           :
    order.status === 'en_preparacion' ? 'preparing'           :
    order.status === 'pagado'         ? 'confirmed'           :
    'pending_confirmation'
  )) as FirestoreOrderStatus
  const isCancelled   = firestoreStatus === 'cancelled' || firestoreStatus === 'not_delivered'
  const isConfirmed   = ['confirmed', 'preparing', 'ready_or_on_the_way', 'delivered'].includes(firestoreStatus)
  const canCancel     = ['pending_confirmation', 'confirmed'].includes(firestoreStatus)

  const distInitials = order.distribuidoraName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  const paymentMeta = getPaymentMethodConfig(order.paymentMethod)

  const handleCancelOrder = async () => {
    setIsCancelling(true)
    try {
      await updateOrderStatus(order.id, 'cancelled', 'Cancelado por el comercio')
      setShowCancelDialog(false)
      setActionMessage('Pedido cancelado.')
    } catch {
      setActionMessage('No pudimos cancelar el pedido. Intentá de nuevo.')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_50%,#f3f4f6_100%)] pb-10">

      {/* Toast */}
      {actionMessage && (
        <div className="fixed top-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl bg-[#0B1A45] px-4 py-3 text-center text-sm font-semibold text-white shadow-xl">
          {actionMessage}
        </div>
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar pedido</AlertDialogTitle>
            <AlertDialogDescription>
              {firestoreStatus === 'pending_confirmation'
                ? 'Este pedido está pendiente de confirmación. Si lo cancelás, la distribuidora dejará de verlo como activo.'
                : 'La distribuidora ya aceptó el pedido. Si lo cancelás, el stock se devolverá. Te recomendamos avisarle primero.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelOrder} disabled={isCancelling}>
              {isCancelling ? 'Cancelando...' : 'Cancelar pedido'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#DFE1E8]/80">
        <div className="flex items-center gap-3 h-14 px-4 max-w-4xl mx-auto">
          <Link
            href="/comercio/pedidos"
            className="h-9 w-9 rounded-full bg-[#F7F8FA] border border-[#DFE1E8] flex items-center justify-center hover:bg-gray-100 transition-colors active:scale-95 shrink-0"
          >
            <ArrowLeft className="h-4 w-4 text-[#0B1A45]" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none">Pedido</p>
            <h1 className="font-mono text-base font-bold leading-tight text-foreground">{order.orderNumber}</h1>
          </div>
          <StatusBadge status={firestoreStatus} />
        </div>
      </header>

      <main className="px-4 py-5 max-w-4xl mx-auto w-full space-y-4">

        {/* Resumen del pedido */}
        <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 p-5 md:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B1A45] font-bold text-white shadow-[0_10px_24px_rgba(11,26,69,0.16)]">
              {distInitials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Detalle del pedido</p>
                  <h2 className="mt-1 truncate font-heading text-xl font-bold text-[#0B1A45] md:text-2xl">{order.distribuidoraName}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {order.orderNumber} · {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-3 md:flex-col md:items-end md:gap-2">
                  <span className="font-heading text-2xl font-bold text-[#0B1A45]">{formatCurrency(order.total)}</span>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <StatusBadge status={firestoreStatus} />
                    <PaymentMethodBadge method={order.paymentMethod} />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-[#DFE1E8] bg-[#F7F8FA] px-4 py-3">
                <p className="text-sm font-semibold text-[#0B1A45]">{order.items.length} productos</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{paymentMeta.detail}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estado del pedido */}
        <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 p-5">
          <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C] mb-4">Estado del pedido</h2>

          {/* Cancelado / no entregado */}
          {isCancelled && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 rounded-2xl border border-red-100 mb-4">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">
                  {firestoreStatus === 'cancelled' ? 'Pedido cancelado' : 'Pedido no entregado'}
                </p>
                {order.cancellationReason && (
                  <p className="text-xs text-red-600 mt-0.5">Motivo: {order.cancellationReason}</p>
                )}
              </div>
            </div>
          )}

          {/* External pending notice */}
          {isExternal && firestoreStatus === 'pending_confirmation' && (
            <div className="flex items-start gap-3 p-3.5 bg-amber-50 rounded-2xl border border-amber-100 mb-4">
              <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Esperando que <span className="font-semibold">{order.distribuidoraName}</span> confirme el pedido. Te notificaremos cuando respondan.
              </p>
            </div>
          )}

          {/* Cancel action */}
          {canCancel && !isCancelled && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border border-red-100 bg-red-50 mb-4">
              <div>
                <p className="text-sm font-semibold text-red-700">¿Necesitás cancelar?</p>
                <p className="text-xs text-red-600 mt-0.5">
                  {firestoreStatus === 'pending_confirmation'
                    ? 'Podés cancelarlo mientras esté pendiente de confirmación.'
                    : 'Podés cancelarlo antes de que la distribuidora inicie la preparación.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCancelDialog(true)}
                className="shrink-0 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
              >
                Cancelar pedido
              </button>
            </div>
          )}

          {/* Timeline */}
          {!isCancelled && (
            <div className="relative pl-1">
              {statusSteps.map((step, index) => {
                const s = getStepStatus(firestoreStatus, step.key)
                const isLast = index === statusSteps.length - 1
                return (
                  <div key={step.key} className="flex gap-4 pb-5 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors',
                        s === 'completed' ? 'bg-[#89B317]' :
                        s === 'current'   ? 'bg-primary ring-4 ring-primary/15' :
                        'bg-[#F7F8FA] border border-[#DFE1E8]'
                      )}>
                        {s === 'completed' ? (
                          <Check className="h-3.5 w-3.5 text-white" />
                        ) : s === 'current' ? (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                        )}
                      </div>
                      {!isLast && (
                        <div className={cn(
                          'w-0.5 flex-1 mt-1.5',
                          s === 'completed' ? 'bg-[#89B317]/40' : 'bg-[#DFE1E8]'
                        )} />
                      )}
                    </div>
                    <div className="flex-1 pt-0.5 pb-1">
                      <p className={cn(
                        'font-semibold text-sm',
                        s === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                      )}>
                        {step.label}
                      </p>
                      {s === 'current' && (
                        <p className="text-xs text-primary font-medium mt-0.5">{step.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Contacto distribuidora — solo para external confirmado */}
        {isExternal && isConfirmed && distribuidora && (
          <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-amber-200/60 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Handshake className="h-4 w-4 text-amber-500" />
              <h2 className="font-bold text-xs uppercase tracking-widest text-amber-600">Contacto para coordinar</h2>
            </div>
            <div className="space-y-3">
              {[
                { icon: Phone, label: 'Teléfono', value: distribuidora.phone },
                { icon: MapPin, label: 'Dirección', value: distribuidora.address },
                ...(distribuidora.deliveryHours ? [{ icon: Clock, label: 'Horario', value: distribuidora.deliveryHours }] : []),
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
                    <p className="font-semibold text-foreground text-sm">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calificar */}
        {order.status === 'entregado' && hasReview !== null && (
          <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 p-5">
            {hasReview ? (
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Reseña enviada</p>
                  <p className="text-xs text-muted-foreground">Ya calificaste este pedido</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Star className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-sm">¿Cómo estuvo el pedido?</p>
                    <p className="text-xs text-muted-foreground">Calificá a {order.distribuidoraName}</p>
                  </div>
                </div>
                <Link
                  href={`/comercio/pedidos/calificar/${id}`}
                  className="shrink-0 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors"
                >
                  Calificar
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Productos */}
        <div className="bg-white rounded-3xl shadow-[0_1px_3px_rgba(11,26,69,0.04),0_4px_14px_rgba(11,26,69,0.05)] border border-[#DFE1E8]/80 p-5">
          <h2 className="font-bold text-xs uppercase tracking-widest text-[#7A839C] mb-4">
            Productos · {order.items.length} {order.items.length === 1 ? 'ítem' : 'ítems'}
          </h2>
          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground leading-snug">{item.productName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatCurrency(item.unitPrice)} × {item.quantity}
                  </p>
                </div>
                <span className="font-bold text-sm text-foreground shrink-0">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Subtotal</span>
              <span className="font-medium">{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Envío</span>
              <span className="font-bold text-[#4A662E]">Gratis</span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="font-bold text-foreground">Total</span>
              <span className="font-heading font-bold text-xl text-foreground">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

export default function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <PedidoDetail id={id} />
}
