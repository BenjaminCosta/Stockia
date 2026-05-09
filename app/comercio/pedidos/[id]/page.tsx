'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { mockOrders, formatCurrency } from '@/lib/mock-data'
import { CategoryIcon } from '@/components/category-icon'

const statusSteps = [
  { key: 'pendiente', label: 'Pedido creado' },
  { key: 'pagado', label: 'Pagado' },
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

export default function PedidoDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = use(params)
  const order = mockOrders.find(o => o.id === id)

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Pedido no encontrado</p>
        <Link href="/comercio/pedidos" className="text-primary mt-2">
          Volver a mis pedidos
        </Link>
      </div>
    )
  }

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

      {/* Content */}
      <main className="flex-1 px-4 py-6 max-w-4xl mx-auto w-full">
        {/* Status */}
        <Card className="border-border mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg text-foreground">Estado del pedido</CardTitle>
              <StatusBadge status={order.status} />
            </div>
          </CardHeader>
          <CardContent>
            {/* Timeline */}
            <div className="relative">
              {statusSteps.map((step, index) => {
                const stepStatus = getStepStatus(order.status, step.key)
                const isLast = index === statusSteps.length - 1
                
                return (
                  <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
                    {/* Line and dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        stepStatus === 'completed' 
                          ? 'bg-emerald-500' 
                          : stepStatus === 'current'
                            ? 'bg-primary'
                            : 'bg-muted'
                      }`}>
                        {stepStatus === 'completed' ? (
                          <Check className="h-4 w-4 text-white" />
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${
                            stepStatus === 'current' ? 'bg-primary-foreground' : 'bg-muted-foreground'
                          }`} />
                        )}
                      </div>
                      {!isLast && (
                        <div className={`w-0.5 flex-1 mt-2 ${
                          stepStatus === 'completed' ? 'bg-emerald-500' : 'bg-border'
                        }`} />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pt-1">
                      <p className={`font-medium ${
                        stepStatus === 'upcoming' ? 'text-muted-foreground' : 'text-foreground'
                      }`}>
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
          </CardContent>
        </Card>

        {/* Order info */}
        <Card className="border-border mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg text-foreground">Información del pedido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Número de pedido</span>
              <span className="font-medium text-foreground">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha</span>
              <span className="font-medium text-foreground">
                {new Date(order.createdAt).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Distribuidora</span>
              <span className="font-medium text-foreground">{order.distribuidoraName}</span>
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
              {order.items.map((item, index) => {
                return (
                  <div key={index} className="flex items-center gap-3">
                    <CategoryIcon category={item.productName} className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate">{item.productName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.unitPrice)} x {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium text-foreground">
                      {formatCurrency(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                )
              })}
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
