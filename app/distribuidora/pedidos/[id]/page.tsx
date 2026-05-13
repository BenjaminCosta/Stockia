'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle, Truck } from 'lucide-react'
import { mockOrders, formatCurrency, mockComercios, getDistribuidoraById, getEstimatedDeliveryDate } from '@/lib/mock-data'
import { OrderStatus } from '@/lib/types'
import { LoadingButton } from '@/components/ui/LoadingButton'

const statusColors: Record<OrderStatus, string> = {
  pendiente: 'bg-amber-100 text-amber-700 border-amber-200',
  pagado: 'bg-blue-100 text-blue-700 border-blue-200',
  en_preparacion: 'bg-purple-100 text-purple-700 border-purple-200',
  entregado: 'bg-green-100 text-green-700 border-green-200',
}

const statusLabels: Record<OrderStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  en_preparacion: 'En preparación',
  entregado: 'Entregado',
}

export default function PedidoDistribuidoraDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const order = mockOrders.find(o => o.id === id)
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order?.status || 'pendiente')
  const distribuidora = order ? getDistribuidoraById(order.distribuidoraId) : null
  const estimatedDelivery = distribuidora
    ? getEstimatedDeliveryDate(distribuidora.deliveryTimeHours)
    : 'Próximos días hábiles'
  const [isUpdating, setIsUpdating] = useState(false)

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Pedido no encontrado</p>
        <Link href="/distribuidora/pedidos" className="text-primary mt-2">Volver a pedidos</Link>
      </div>
    )
  }

  const comercio = mockComercios.find(c => c.id === order.comercioId)

  const handleStatusChange = async (nextStatus: OrderStatus) => {
    setIsUpdating(true)
    await new Promise(resolve => setTimeout(resolve, 450))
    setCurrentStatus(nextStatus)
    setIsUpdating(false)
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const dateFormatted = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
  const timeFormatted = new Date(order.createdAt).toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div className="min-h-screen bg-background flex flex-col pb-10">

      {/* Sticky header */}
      <div className="bg-white px-4 md:px-8 py-4 md:py-5 sticky top-0 z-20 shadow-sm flex items-center gap-3">
        <Link
          href="/distribuidora/pedidos"
          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground">{order.orderNumber}</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">{dateFormatted} · {timeFormatted}hs</p>
        </div>
        <span className={`text-[10px] md:text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide border ${statusColors[currentStatus]}`}>
          {statusLabels[currentStatus]}
        </span>
      </div>

      <div className="px-4 md:px-8 mt-6 max-w-4xl mx-auto w-full space-y-4 md:space-y-6">

        {/* Comercio + Entrega grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Comercio card */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm md:shadow-md border border-border p-5 md:p-8">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Comercio</h2>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 md:h-16 md:w-16 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-lg md:text-xl shrink-0">
                {order.comercioName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-base md:text-lg">{order.comercioName}</p>
                <div className="flex flex-col gap-1.5 mt-2">
                  <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground bg-gray-50 px-2 py-1 rounded w-max">
                    <MapPin className="h-3.5 w-3.5" /> {comercio?.address || 'Av. Mitre 1234'}, {order.zone}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs md:text-sm text-muted-foreground bg-gray-50 px-2 py-1 rounded w-max">
                    <Phone className="h-3.5 w-3.5" /> {comercio?.phone || '+54 11 4567-8901'}
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full mt-6 text-sm text-primary font-bold border-2 border-primary/20 px-4 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all">
              Contactar por WhatsApp
            </button>
          </div>

          {/* Entrega card */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm md:shadow-md border border-border p-5 md:p-8">
            <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">Entrega</h2>
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 md:h-14 md:w-14 bg-[#F1FFD1] text-[#4A662E] rounded-2xl flex items-center justify-center shrink-0">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-foreground text-base">{order.comercioName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {comercio?.address || 'Av. San Martín 450'}, {order.zone}
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-xs md:text-sm font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg w-max capitalize">
                  <Clock className="h-4 w-4" /> Entrega: {estimatedDelivery}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Products card */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm md:shadow-md border border-border p-5 md:p-8">
          <h2 className="font-bold text-foreground text-sm uppercase tracking-wider mb-6">
            Productos del pedido
          </h2>
          <div className="space-y-4">
            {order.items.map((item, i) => (
              <div
                key={i}
                className={`flex justify-between items-start gap-4 ${i !== 0 ? 'pt-4 border-t border-gray-100' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 md:h-6 md:w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-sm md:text-base text-foreground leading-tight">{item.productName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatCurrency(item.unitPrice)} x {item.quantity} un.
                    </p>
                  </div>
                </div>
                <p className="font-heading font-bold text-foreground text-base md:text-lg shrink-0">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 mt-6 pt-6 space-y-3 text-sm md:text-base">
            <div className="flex justify-between text-muted-foreground font-medium">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span className="text-muted-foreground">Envío</span>
              <span className="text-green-600 font-bold">Gratis</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100 mt-2">
              <span className="font-bold text-foreground text-lg">Total</span>
              <span className="font-heading font-bold text-2xl md:text-3xl text-primary">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        {currentStatus !== 'entregado' && (
          <div className="space-y-3 pt-4">
            {currentStatus === 'pagado' && (
              <LoadingButton
                className="w-full h-14 rounded-xl text-base font-bold gap-2 shadow-md"
                onClick={() => handleStatusChange('en_preparacion')}
                loading={isUpdating}
                loadingLabel="Actualizando estado"
              >
                <Package className="h-5 w-5" /> Iniciar preparación
              </LoadingButton>
            )}
            {currentStatus === 'en_preparacion' && (
              <LoadingButton
                className="w-full h-14 rounded-xl text-base font-bold gap-2 bg-blue-600 hover:bg-blue-700 shadow-md"
                onClick={() => handleStatusChange('entregado')}
                loading={isUpdating}
                loadingLabel="Actualizando estado"
              >
                <Truck className="h-5 w-5" /> Marcar en camino
              </LoadingButton>
            )}
            {(currentStatus === 'en_preparacion' || currentStatus === 'pagado') && (
              <button
                onClick={() => handleStatusChange('entregado')}
                className="w-full h-14 rounded-xl text-base font-bold gap-2 flex items-center justify-center text-green-700 border-2 border-green-200 hover:bg-green-50 hover:border-green-300 transition-colors"
              >
                <CheckCircle className="h-5 w-5" /> Marcar como entregado
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
