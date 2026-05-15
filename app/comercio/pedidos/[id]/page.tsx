'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Star, Handshake, Phone, MapPin, CreditCard, Clock, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { formatCurrency } from '@/lib/mock-data'
import { useOrder } from '@/hooks/use-data'
import { CategoryIcon } from '@/components/category-icon'
import { getReviewByOrder } from '@/lib/data/reviews.service'
import { mockDistribuidoras } from '@/lib/mock-data'

const statusSteps = [
  { key: 'pendiente', label: 'Pedido creado' },
  { key: 'pagado', label: 'Confirmado' },
  { key: 'en_preparacion', label: 'En preparación' },
  { key: 'entregado', label: 'Entregado' },
]

function getStepStatus(currentStatus: string, stepKey: string): 'completed' | 'current' | 'upcoming' {
  const statusOrder = ['pendiente', 'pagado', 'en_preparacion', 'entregado']
  const currentIndex = statusOrder.indexOf(currentStatus)
  const stepIndex = statusOrder.indexOf(stepKey)
  if (stepIndex < currentIndex) return 'completed'
  if (stepIndex === currentIndex) return 'current'
  return 'upcoming'
}

function PaymentMethodBadge({ method }: { method?: string }) {
  if (method === 'external') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <Handshake className="h-3 w-3" />
        A coordinar con distribuidora
      </span>
    )
  }
  if (method === 'mercado_pago') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <CreditCard className="h-3 w-3" />
        Mercado Pago
      </span>
    )
  }
  return null
}

function PedidoDetail({ id }: { id: string }) {
  const { data: order, loading } = useOrder(id)
  const [hasReview, setHasReview] = useState<boolean | null>(null)

  useEffect(() => {
    if (order?.status === 'entregado') {
      getReviewByOrder(id).then(r => setHasReview(!!r))
    }
  }, [id, order?.status])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Pedido no encontrado</p>
        <Link href="/comercio/pedidos" className="text-primary mt-2">Volver a mis pedidos</Link>
      </div>
    )
  }

  const isExternal = order.paymentMethod === 'external'
  const firestoreStatus = order.firestoreStatus ?? (
    order.status === 'entregado' ? 'delivered' :
    order.status === 'en_preparacion' ? 'preparing' :
    order.status === 'pagado' ? 'confirmed' :
    'pending_confirmation'
  )
  const isCancelled = firestoreStatus === 'cancelled' || firestoreStatus === 'not_delivered'
  const isConfirmed = ['confirmed', 'preparing', 'ready_or_on_the_way', 'delivered'].includes(firestoreStatus)
  const distribuidora = mockDistribuidoras.find(d => d.id === order.distribuidoraId)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="flex items-center h-14 px-4 max-w-4xl mx-auto">
          <Link href="/comercio/pedidos" className="p-2 -ml-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="font-heading font-semibold text-lg ml-2 text-foreground">{order.orderNumber}</h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full space-y-4">

        {/* Status card */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-heading text-lg text-foreground">Estado del pedido</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusBadge status={isCancelled ? firestoreStatus : order.status} />
                <PaymentMethodBadge method={order.paymentMethod} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Cancelled/Not delivered notice */}
            {isCancelled && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100 mb-4">
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
              <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 mb-4">
                <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Esperando confirmación de <span className="font-semibold">{order.distribuidoraName}</span>. Te avisaremos cuando acepten el pedido.
                </p>
              </div>
            )}

            {/* Timeline */}
            {!isCancelled && (
              <div className="relative">
                {statusSteps.map((step, index) => {
                  const stepStatus = getStepStatus(order.status, step.key)
                  const isLast = index === statusSteps.length - 1
                  return (
                    <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          stepStatus === 'completed' ? 'bg-emerald-500' :
                          stepStatus === 'current' ? 'bg-primary' : 'bg-muted'
                        }`}>
                          {stepStatus === 'completed' ? (
                            <Check className="h-4 w-4 text-white" />
                          ) : (
                            <span className={`w-2 h-2 rounded-full ${stepStatus === 'current' ? 'bg-primary-foreground' : 'bg-muted-foreground'}`} />
                          )}
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 flex-1 mt-2 ${stepStatus === 'completed' ? 'bg-emerald-500' : 'bg-border'}`} />
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className={`font-medium ${stepStatus === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {step.label}
                        </p>
                        {stepStatus === 'current' && (
                          <p className="text-sm text-primary mt-0.5">Estado actual</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact info — only for confirmed external orders */}
        {isExternal && isConfirmed && distribuidora && (
          <Card className="border-border border-amber-200">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base text-foreground flex items-center gap-2">
                <Handshake className="h-4 w-4 text-amber-500" />
                Datos de contacto para coordinar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono operativo</p>
                  <p className="font-semibold text-foreground">{distribuidora.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dirección</p>
                  <p className="font-semibold text-foreground">{distribuidora.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Horario de atención</p>
                  <p className="font-semibold text-foreground">{distribuidora.deliveryHours}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calificar CTA — only for entregado orders */}
        {order.status === 'entregado' && hasReview !== null && (
          <Card className="border-border">
            <CardContent className="pt-4">
              {hasReview ? (
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Reseña enviada</p>
                    <p className="text-xs text-gray-400">Ya calificaste este pedido</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Star className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">¿Cómo estuvo el pedido?</p>
                      <p className="text-xs text-gray-400">Calificá a {order.distribuidoraName}</p>
                    </div>
                  </div>
                  <Link
                    href={`/comercio/pedidos/calificar/${id}`}
                    className="shrink-0 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Calificar
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Order info */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg text-foreground">Información del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Número de pedido</span>
              <span className="font-medium text-foreground font-mono text-sm">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium text-foreground">
                {new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distribuidora</span>
              <span className="font-medium text-foreground">{order.distribuidoraName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Pago</span>
              <PaymentMethodBadge method={order.paymentMethod} />
            </div>
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg text-foreground">Productos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CategoryIcon category={item.productName} className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground truncate">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.unitPrice)} x {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium text-foreground">{formatCurrency(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium text-foreground">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-heading font-bold text-lg text-foreground">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function PedidoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <PedidoDetail id={id} />
}
