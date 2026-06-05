'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle, Truck, X, AlertTriangle, Handshake, CreditCard, BadgePercent, Star, FileDown } from 'lucide-react'
import { formatCurrency, getEstimatedDeliveryDate } from '@/lib/mock-data'
import { useOrder, useDistributor } from '@/hooks/use-data'
import { getCommerceById, type FirestoreCommerce } from '@/lib/data/users.service'
import { updateOrderStatus, releasePendingStock } from '@/lib/data/orders.service'
import type { OrderStatus as FSOrderStatus } from '@/lib/data/orders.service'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { getCommerceReviewByOrder } from '@/lib/data/commerce-reviews.service'
import { CommerceReviewModal } from '@/components/CommerceReviewModal'
import { FeedbackModal } from '@/components/FeedbackModal'
import { useApp } from '@/lib/app-context'
import type { Distribuidora } from '@/lib/types'
import { OrderDetailSkeleton } from '@/components/ui/SkeletonCard'
import { printRemito } from '@/lib/utils/remito'

// ─── Status system ────────────────────────────────────────────────────────────

type DistribStatus = FSOrderStatus

const STATUS_LABELS: Record<DistribStatus, string> = {
  pending_confirmation:  'Pendiente de confirmación',
  confirmed:             'Confirmado',
  preparing:             'En preparación',
  ready_or_on_the_way:   'En camino / listo',
  delivered:             'Entregado',
  cancelled:             'Cancelado',
  not_delivered:         'No entregado',
}

const STATUS_COLORS: Record<DistribStatus, string> = {
  pending_confirmation:  'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:             'bg-blue-50 text-blue-700 border-blue-200',
  preparing:             'bg-[#F1FFD1] text-[#4A662E] border-[#89B317]/30',
  ready_or_on_the_way:   'bg-sky-50 text-sky-700 border-sky-200',
  delivered:             'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled:             'bg-red-50 text-red-600 border-red-200',
  not_delivered:         'bg-orange-50 text-orange-700 border-orange-200',
}

const CANCELLATION_REASONS = [
  'Falta de stock',
  'Comercio no pagó',
  'Comercio rechazó el pedido',
  'Dirección incorrecta',
  'No había nadie para recibir',
  'Otro motivo',
]

function toFirestoreStatus(localStatus: string): DistribStatus {
  if (localStatus === 'entregado') return 'delivered'
  if (localStatus === 'en_preparacion') return 'preparing'
  if (localStatus === 'pagado') return 'confirmed'
  if (localStatus === 'cancelado') return 'cancelled'
  if (localStatus === 'no_entregado') return 'not_delivered'
  return 'pending_confirmation'
}

// ─── Cancellation modal ───────────────────────────────────────────────────────

function CancellationModal({
  title,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-md p-6">
        <h3 className="font-heading font-bold text-lg text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-400 mb-5">Seleccioná el motivo para registrarlo en el historial.</p>
        <div className="space-y-2 mb-6">
          {CANCELLATION_REASONS.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                reason === r
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Volver
          </button>
          <button
            onClick={() => reason && onConfirm(reason)}
            disabled={!reason || loading}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main detail component ────────────────────────────────────────────────────

function PedidoDistribuidoraDetail({ id }: { id: string }) {
  const { currentUser } = useApp()
  const distribuidoraUser = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const { data: order, loading } = useOrder(id)
  const { data: distribuidora } = useDistributor(order?.distribuidoraId || '')
  const [currentFSStatus, setCurrentFSStatus] = useState<DistribStatus>('pending_confirmation')
  const [isUpdating, setIsUpdating] = useState(false)
  const [comercioData, setComercioData] = useState<(FirestoreCommerce & { id: string }) | null>(null)
  const [cancellationModal, setCancellationModal] = useState<'cancelled' | 'not_delivered' | null>(null)
  const [showSuccessMsg, setShowSuccessMsg] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [showFeedbackAfterReview, setShowFeedbackAfterReview] = useState(false)
  const [alreadyReviewed, setAlreadyReviewed] = useState<boolean | null>(null)

  // Sync status when order loads + fetch real commerce data
  useEffect(() => {
    if (order) {
      const fs = order.firestoreStatus as DistribStatus | undefined
      setCurrentFSStatus(fs ?? toFirestoreStatus(order.status))
      if (order.comercioId) {
        getCommerceById(order.comercioId).then(c => setComercioData(c))
      }
      // If commerce cancelled the order but stock wasn't released (no product write perms),
      // the distributor panel resolves it now since it has the required access.
      if ((fs === 'cancelled' || order.status === 'cancelado') && (order as any).pendingStockRelease) {
        releasePendingStock(order.id).catch(err =>
          console.error('[distribuidora/pedido] releasePendingStock failed', err)
        )
      }
    }
  }, [order])

  // Check if this order already has a commerce review
  useEffect(() => {
    if (!order?.id) return
    const fsStatus = (order.firestoreStatus as DistribStatus | undefined) ?? toFirestoreStatus(order.status)
    const isTerminalStatus = ['delivered', 'cancelled', 'not_delivered'].includes(fsStatus)
    if (!isTerminalStatus) { setAlreadyReviewed(false); return }
    getCommerceReviewByOrder(order.id).then(r => setAlreadyReviewed(r !== null))
  }, [order])

  if (loading) {
    return <OrderDetailSkeleton />
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-muted-foreground">Pedido no encontrado</p>
        <Link href="/distribuidora/pedidos" className="text-primary mt-2">Volver a pedidos</Link>
      </div>
    )
  }

  const estimatedDelivery = distribuidora
    ? getEstimatedDeliveryDate((distribuidora as any).deliveryTimeHours)
    : 'Próximos días hábiles'
  const dateFormatted = new Date(order.createdAt).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
  const timeFormatted = new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const isExternal = order.paymentMethod === 'external'
  const isTerminal = currentFSStatus === 'delivered' || currentFSStatus === 'cancelled' || currentFSStatus === 'not_delivered'
  const isContactVisible = !['pending_confirmation'].includes(currentFSStatus)
  const commissionRate = distribuidoraUser?.commissionRate ?? 0.015
  const commission = order.total * commissionRate

  const handleStatusChange = async (nextStatus: DistribStatus, cancellationReason?: string) => {
    setIsUpdating(true)
    try {
      await updateOrderStatus(order.id, nextStatus, cancellationReason)
      setCurrentFSStatus(nextStatus)
      if (nextStatus === 'delivered') setShowSuccessMsg('¡Pedido marcado como entregado! Se generó la comisión.')
      else if (nextStatus === 'confirmed') setShowSuccessMsg('Pedido confirmado. Podés coordinar pago y entrega con el comercio.')
      setTimeout(() => setShowSuccessMsg(null), 4000)
    } catch (err) {
      console.error('[pedido] updateOrderStatus failed', err)
    } finally {
      setIsUpdating(false)
      setCancellationModal(null)
    }
  }

  const subtotal = order.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  return (
    <div className="min-h-screen bg-background flex flex-col pb-10">

      {/* Success toast */}
      {showSuccessMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold max-w-xs text-center animate-fade-in">
          {showSuccessMsg}
        </div>
      )}

      {/* Cancellation modal */}
      {cancellationModal && (
        <CancellationModal
          title={cancellationModal === 'cancelled' ? 'Cancelar pedido' : 'Marcar como no entregado'}
          onConfirm={reason => handleStatusChange(cancellationModal, reason)}
          onCancel={() => setCancellationModal(null)}
          loading={isUpdating}
        />
      )}

      {/* Commerce review modal → step 1 */}
      {showReviewModal && order && distribuidoraUser && (
        <CommerceReviewModal
          order={order}
          distributorId={distribuidoraUser.id}
          distributorName={distribuidoraUser.companyName}
          onClose={() => setShowReviewModal(false)}
          onSubmitted={() => {
            setAlreadyReviewed(true)
            setShowReviewModal(false)
            setShowFeedbackAfterReview(true)
          }}
        />
      )}

      {/* Feedback modal → step 2 (after rating a commerce) */}
      {showFeedbackAfterReview && (
        <FeedbackModal onClose={() => setShowFeedbackAfterReview(false)} />
      )}

      {/* Sticky header */}
      <div className="bg-white/95 backdrop-blur-sm px-4 md:px-8 py-3 md:py-4 sticky top-0 z-20 border-b border-[#DFE1E8]/80 flex items-center gap-3">
        <Link
          href="/distribuidora/pedidos"
          className="h-9 w-9 rounded-xl bg-[#F7F8FA] border border-[#DFE1E8]/80 flex items-center justify-center text-[#5F6880] hover:bg-[#EFF0F3] transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-xl text-foreground truncate">{order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{dateFormatted} · {timeFormatted}hs</p>
        </div>
        <span className={`text-[10px] md:text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wide border shrink-0 ${STATUS_COLORS[currentFSStatus]}`}>
          {STATUS_LABELS[currentFSStatus]}
        </span>
        <button
          onClick={() => printRemito(order, comercioData, distribuidora as any)}
          title="Descargar remito PDF"
          className="h-9 w-9 rounded-xl bg-[#F7F8FA] border border-[#DFE1E8]/80 flex items-center justify-center text-[#5F6880] hover:bg-[#0B1A45] hover:text-[#C8FF00] hover:border-[#0B1A45] transition-all shrink-0"
        >
          <FileDown className="h-4 w-4" />
        </button>
      </div>

      <div className="px-4 md:px-8 mt-6 max-w-4xl mx-auto w-full space-y-4 md:space-y-6">

        {/* Payment method banner */}
        {isExternal && (
          <div className={`flex items-start gap-3 p-4 rounded-2xl border ${
            currentFSStatus === 'pending_confirmation'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-white border-gray-200'
          }`}>
            <Handshake className={`h-5 w-5 shrink-0 mt-0.5 ${currentFSStatus === 'pending_confirmation' ? 'text-amber-500' : 'text-gray-400'}`} />
            <div>
              <p className="font-semibold text-sm text-gray-900">Pago a coordinar</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {currentFSStatus === 'pending_confirmation'
                  ? 'Este pedido requiere tu confirmación antes de proceder con el pago y la entrega.'
                  : 'El pago y la entrega se coordinarán directamente con el comercio.'}
              </p>
            </div>
          </div>
        )}

        {/* Cancelled / not delivered notice */}
        {(currentFSStatus === 'cancelled' || currentFSStatus === 'not_delivered') && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700 text-sm">
                {currentFSStatus === 'cancelled' ? 'Pedido cancelado' : 'Pedido no entregado'}
              </p>
              {order.cancellationReason && (
                <p className="text-xs text-red-600 mt-0.5">Motivo: {order.cancellationReason}</p>
              )}
              <p className="text-xs text-red-500 mt-1">No se generó comisión para este pedido.</p>
            </div>
          </div>
        )}

        {/* Commission badge when delivered */}
        {currentFSStatus === 'delivered' && !order.commissionError && (
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
            <BadgePercent className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-emerald-800 text-sm">Comisión generada</p>
              <p className="text-xs text-emerald-700 mt-0.5">{(commissionRate * 100).toFixed(1)}% sobre {formatCurrency(order.total)}</p>
            </div>
            <p className="font-heading font-bold text-emerald-700">{formatCurrency(commission)}</p>
          </div>
        )}

        {/* Commission error — pending reconciliation */}
        {currentFSStatus === 'delivered' && order.commissionError && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Comisión pendiente de revisión</p>
              <p className="text-xs text-amber-700 mt-0.5">Hubo un error al registrar la comisión automáticamente. El equipo de Stockia lo resolverá en breve.</p>
            </div>
          </div>
        )}

        {/* Comercio + Entrega grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

          {/* Comercio card — contact hidden until confirmed */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-[#DFE1E8]/80 p-5 md:p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-4">Comercio</h2>
            <div className="flex items-start gap-3 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-[#0B1A45] flex items-center justify-center font-bold text-white text-sm shrink-0">
                {order.comercioName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-foreground text-base">{order.comercioName}</p>
              </div>
            </div>

            {isContactVisible ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-[#F7F8FA] px-3 py-2 rounded-xl">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {comercioData?.address || order.comercioName}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-[#F7F8FA] px-3 py-2 rounded-xl">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {comercioData?.phone || 'Teléfono no informado'}
                </div>
                {comercioData?.phone && (
                  <a
                    href={`https://wa.me/${comercioData.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-2 text-sm text-primary font-bold border-2 border-primary/20 px-4 py-2.5 rounded-xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <Phone className="h-4 w-4" /> Contactar por WhatsApp
                  </a>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <AlertTriangle className="h-4 w-4 text-gray-300 shrink-0" />
                <p className="text-xs text-gray-400">Los datos de contacto se habilitan al confirmar el pedido</p>
              </div>
            )}
          </div>

          {/* Entrega card */}
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-[#DFE1E8]/80 p-5 md:p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-4">Entrega</h2>
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 bg-[#F1FFD1] text-[#4A662E] rounded-2xl flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-foreground text-sm">{order.comercioName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {comercioData?.address || 'Dirección no informada'}
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg w-max capitalize">
                  <Clock className="h-3.5 w-3.5" /> Entrega: {estimatedDelivery}
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="mt-4 pt-4 border-t border-[#DFE1E8]/60">
              {isExternal ? (
                <div className="flex items-center gap-2 text-sm">
                  <Handshake className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="text-gray-600 font-medium">Pago: a coordinar directamente</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm">
                  <CreditCard className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="text-gray-600 font-medium">Pago: Mercado Pago</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Products card */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-[#DFE1E8]/80 p-5 md:p-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C] mb-4">
            Productos del pedido
          </h2>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className={`flex justify-between items-start gap-4 ${i !== 0 ? 'pt-3 border-t border-[#DFE1E8]/60' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-gray-50 rounded-xl flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground leading-tight">{item.productName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatCurrency(item.unitPrice)} x {item.quantity} un.</p>
                  </div>
                </div>
                <p className="font-heading font-bold text-foreground text-base shrink-0">{formatCurrency(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-[#DFE1E8]/60 mt-4 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between font-medium text-muted-foreground">
              <span>Envío</span><span className="text-green-600 font-bold">Gratis</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-[#DFE1E8]/60">
              <span className="font-bold text-foreground text-base">Total</span>
              <span className="font-heading font-bold text-2xl text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Remito PDF */}
        <div>
          <button
            onClick={() => printRemito(order, comercioData, distribuidora as any)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-[#DFE1E8] text-[#5F6880] font-semibold text-sm hover:bg-[#0B1A45] hover:text-[#C8FF00] hover:border-[#0B1A45] transition-all"
          >
            <FileDown className="h-4 w-4" />
            Descargar remito PDF
          </button>
        </div>

        {/* Calificar comercio — shown when order is terminal */}
        {isTerminal && alreadyReviewed !== null && (
          <div className="pb-2">
            {alreadyReviewed ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                <Star className="h-5 w-5 text-amber-400 fill-amber-400 shrink-0" />
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Reseña enviada</p>
                  <p className="text-xs text-gray-400 mt-0.5">Ya calificaste a este comercio para este pedido.</p>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowReviewModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-[#0B1A45]/20 text-[#0B1A45] font-bold text-sm hover:bg-[#0B1A45] hover:text-[#C8FF00] transition-all"
              >
                <Star className="h-4 w-4" />
                Calificar comercio
              </button>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!isTerminal && (
          <div className="space-y-3 pb-4">
            {/* Pending confirmation */}
            {currentFSStatus === 'pending_confirmation' && (
              <>
                <LoadingButton
                  className="w-full h-14 rounded-xl text-base font-bold gap-2 bg-[#0B1A45] text-[#C8FF00] hover:bg-[#0B1A45]/90 shadow-md"
                  onClick={() => handleStatusChange('confirmed')}
                  loading={isUpdating}
                  loadingLabel="Confirmando..."
                >
                  <CheckCircle className="h-5 w-5" /> Aceptar pedido
                </LoadingButton>
                <button
                  onClick={() => setCancellationModal('cancelled')}
                  className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <X className="h-4 w-4" /> Rechazar pedido
                </button>
              </>
            )}

            {/* Confirmed */}
            {currentFSStatus === 'confirmed' && (
              <LoadingButton
                className="w-full h-14 rounded-xl text-base font-bold gap-2 shadow-md"
                onClick={() => handleStatusChange('preparing')}
                loading={isUpdating}
                loadingLabel="Actualizando..."
              >
                <Package className="h-5 w-5" /> Iniciar preparación
              </LoadingButton>
            )}

            {/* Preparing */}
            {currentFSStatus === 'preparing' && (
              <LoadingButton
                className="w-full h-14 rounded-xl text-base font-bold gap-2 bg-sky-600 hover:bg-sky-700 shadow-md"
                onClick={() => handleStatusChange('ready_or_on_the_way')}
                loading={isUpdating}
                loadingLabel="Actualizando..."
              >
                <Truck className="h-5 w-5" /> Marcar en camino
              </LoadingButton>
            )}

            {/* Ready / on the way */}
            {currentFSStatus === 'ready_or_on_the_way' && (
              <LoadingButton
                className="w-full h-14 rounded-xl text-base font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 shadow-md"
                onClick={() => handleStatusChange('delivered')}
                loading={isUpdating}
                loadingLabel="Confirmando entrega..."
              >
                <CheckCircle className="h-5 w-5" /> Confirmar entrega
              </LoadingButton>
            )}

            {/* Cancel / not delivered — available from confirmed onwards */}
            {['confirmed', 'preparing', 'ready_or_on_the_way'].includes(currentFSStatus) && (
              <div className="flex gap-2">
                <button
                  onClick={() => setCancellationModal('not_delivered')}
                  className="flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-orange-600 border border-orange-200 hover:bg-orange-50 transition-colors"
                >
                  <AlertTriangle className="h-3.5 w-3.5" /> No entregado
                </button>
                <button
                  onClick={() => setCancellationModal('cancelled')}
                  className="flex-1 h-11 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-red-600 border border-red-200 hover:bg-red-50 transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Cancelar pedido
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PedidoDistribuidoraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <PedidoDistribuidoraDetail id={id} />
}
