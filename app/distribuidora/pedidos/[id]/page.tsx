'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Package, Clock, CheckCircle, Truck, X, AlertTriangle, Handshake, CreditCard, BadgePercent, Star, FileDown } from 'lucide-react'
import { formatCurrency, getEstimatedDeliveryDate } from '@/lib/mock-data'
import { useOrder, useDistributor } from '@/hooks/use-data'
import { getCommerceById, type FirestoreCommerce } from '@/lib/data/users.service'
import { updateOrderStatus, releasePendingStock, adjustOrderItem, bulkConfirmItems, finalizeOrderWithAdjustments, confirmOrderAfterItemReview } from '@/lib/data/orders.service'
import type { OrderStatus as FSOrderStatus } from '@/lib/data/orders.service'
import { ADJUSTMENT_REASONS } from '@/lib/types'
import type { OrderItem, AdjustmentReason, OrderItemStatus } from '@/lib/types'
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
  pending_confirmation:       'Pendiente de confirmación',
  confirmed:                  'Confirmado',
  preparing:                  'En preparación',
  ready_or_on_the_way:        'En camino / listo',
  delivered:                  'Entregado',
  delivered_with_adjustments: 'Entregado c/ajustes',
  cancelled:                  'Cancelado',
  not_delivered:              'No entregado',
}

const STATUS_COLORS: Record<DistribStatus, string> = {
  pending_confirmation:       'bg-amber-50 text-amber-700 border-amber-200',
  confirmed:                  'bg-blue-50 text-blue-700 border-blue-200',
  preparing:                  'bg-[#F1FFD1] text-[#4A662E] border-[#89B317]/30',
  ready_or_on_the_way:        'bg-sky-50 text-sky-700 border-sky-200',
  delivered:                  'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered_with_adjustments: 'bg-teal-50 text-teal-700 border-teal-200',
  cancelled:                  'bg-red-50 text-red-600 border-red-200',
  not_delivered:              'bg-orange-50 text-orange-700 border-orange-200',
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
  if (localStatus === 'entregado_con_ajustes') return 'delivered_with_adjustments'
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

// ─── Item adjustment sheet ────────────────────────────────────────────────────

type AdjustAction = 'confirm' | 'modify' | 'cancel' | 'not_delivered'

function ItemAdjustmentSheet({
  item,
  stage,
  onSave,
  onClose,
  loading,
}: {
  item: OrderItem
  stage: 'review' | 'operational'
  onSave: (adjustment: { itemStatus: OrderItemStatus; confirmedQuantity?: number; cancelledQuantity?: number; reason?: AdjustmentReason; comment?: string }) => Promise<void>
  onClose: () => void
  loading: boolean
}) {
  const requestedQty = item.requestedQuantity ?? item.quantity
  const maxQty = stage === 'review' ? requestedQty : (item.confirmedQuantity ?? requestedQty)
  const [action, setAction] = useState<AdjustAction | null>(null)
  const [qty, setQty] = useState(maxQty)
  const [reason, setReason] = useState<AdjustmentReason | ''>('')
  const [comment, setComment] = useState('')

  const needsReason = action && action !== 'confirm'
  const hasValidQuantity = action !== 'modify' || qty < maxQty
  const canSave = action !== null && hasValidQuantity && (!needsReason || reason !== '')

  const handleSave = async () => {
    if (!action || !canSave) return
    if (action === 'confirm') {
      await onSave({ itemStatus: 'confirmed', confirmedQuantity: maxQty })
    } else if (action === 'modify') {
      await onSave({ itemStatus: 'modified', confirmedQuantity: qty, cancelledQuantity: maxQty - qty, reason: reason as AdjustmentReason, comment: comment || undefined })
    } else if (action === 'cancel') {
      await onSave({ itemStatus: 'cancelled', confirmedQuantity: 0, cancelledQuantity: maxQty, reason: reason as AdjustmentReason, comment: comment || undefined })
    } else if (action === 'not_delivered') {
      await onSave({ itemStatus: 'not_delivered', confirmedQuantity: 0, cancelledQuantity: maxQty, reason: reason as AdjustmentReason, comment: comment || undefined })
    }
  }

  const actionBtns: { id: AdjustAction; label: string; desc: string; color: string }[] = stage === 'review'
    ? [
      { id: 'confirm',       label: 'Aceptar producto',  desc: 'Cantidad solicitada',       color: 'border-[#89B317] bg-[#F1FFD1] text-[#4A662E]' },
      { id: 'modify',        label: 'Reducir cantidad',  desc: 'Aceptar menos unidades',    color: 'border-blue-300 bg-blue-50 text-blue-700' },
      { id: 'cancel',        label: 'No aceptar',        desc: 'Excluir de la confirmación', color: 'border-red-300 bg-red-50 text-red-700' },
      { id: 'not_delivered', label: 'Sin entrega',       desc: 'No podrá entregarse',       color: 'border-orange-300 bg-orange-50 text-orange-700' },
    ]
    : [
      { id: 'confirm',       label: 'Mantener',          desc: 'Sin cambio adicional',      color: 'border-[#89B317] bg-[#F1FFD1] text-[#4A662E]' },
      { id: 'modify',        label: 'Ajustar cantidad',  desc: 'Faltante operativo',        color: 'border-blue-300 bg-blue-50 text-blue-700' },
      { id: 'cancel',        label: 'Cancelar producto', desc: 'No se va a entregar',       color: 'border-red-300 bg-red-50 text-red-700' },
      { id: 'not_delivered', label: 'No entregado',      desc: 'Se intentó pero no pudo',   color: 'border-orange-300 bg-orange-50 text-orange-700' },
    ]

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-heading font-bold text-lg text-gray-900 leading-tight">{item.productName}</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {maxQty} un. disponibles para {stage === 'review' ? 'confirmar' : 'mantener'} · {formatCurrency(requestedQty * item.unitPrice)}
            </p>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-xl bg-gray-100 text-gray-400 hover:bg-gray-200 transition-colors shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action selector */}
        <div className="grid grid-cols-2 gap-2 mb-5">
          {actionBtns.map(btn => (
            <button
              key={btn.id}
              onClick={() => { setAction(btn.id); if (btn.id !== 'modify') setQty(maxQty) }}
              className={`p-3 rounded-xl border-2 text-left transition-all ${action === btn.id ? btn.color + ' border-opacity-100' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
            >
              <p className="font-bold text-sm">{btn.label}</p>
              <p className="text-[11px] opacity-70 mt-0.5">{btn.desc}</p>
            </button>
          ))}
        </div>

        {/* Quantity input for 'modify' */}
        {action === 'modify' && (
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Cantidad confirmada</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                className="h-10 w-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700 font-bold text-lg hover:bg-gray-100 transition-colors"
              >−</button>
              <span className="flex-1 text-center font-heading font-bold text-2xl text-gray-900">{qty}</span>
              <button
                onClick={() => setQty(q => Math.min(maxQty, q + 1))}
                className="h-10 w-10 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700 font-bold text-lg hover:bg-gray-100 transition-colors"
              >+</button>
            </div>
            <p className={`text-xs text-center mt-1 ${qty >= maxQty ? 'text-amber-600' : 'text-gray-400'}`}>
              {qty >= maxQty ? 'Bajá al menos una unidad para registrar un ajuste.' : `máximo ${maxQty} unidades`}
            </p>
          </div>
        )}

        {/* Reason */}
        {needsReason && (
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Motivo <span className="text-red-400">*</span></label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value as AdjustmentReason)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20"
            >
              <option value="">Seleccioná un motivo</option>
              {(Object.entries(ADJUSTMENT_REASONS) as [AdjustmentReason, string][]).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Optional comment */}
        {needsReason && (
          <div className="mb-5">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Comentario (opcional)</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={2}
              placeholder="Detalle adicional..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[#0B1A45]/20 resize-none"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave || loading}
            className="flex-1 py-3 bg-[#0B1A45] text-[#C8FF00] rounded-xl text-sm font-bold hover:bg-[#0B1A45]/90 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Item status pill ─────────────────────────────────────────────────────────

function ItemStatusPill({ status }: { status: OrderItemStatus }) {
  const config: Record<OrderItemStatus, { label: string; className: string }> = {
    pending:              { label: 'Pendiente',          className: 'bg-gray-100 text-gray-500' },
    confirmed:            { label: 'Confirmado',         className: 'bg-[#F1FFD1] text-[#4A662E]' },
    modified:             { label: 'Cantidad reducida',  className: 'bg-blue-50 text-blue-700' },
    cancelled:            { label: 'Cancelado',          className: 'bg-red-50 text-red-600' },
    delivered:            { label: 'Entregado',          className: 'bg-emerald-50 text-emerald-700' },
    partially_delivered:  { label: 'Entregado parcial',  className: 'bg-blue-50 text-blue-700' },
    not_delivered:        { label: 'No entregado',       className: 'bg-orange-50 text-orange-700' },
    rejected_by_commerce: { label: 'Rechazado',          className: 'bg-red-50 text-red-600' },
  }
  const c = config[status] ?? config.pending
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${c.className}`}>
      {c.label}
    </span>
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
  const [adjustingItem, setAdjustingItem] = useState<OrderItem | null>(null)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [isBulkConfirming, setIsBulkConfirming] = useState(false)
  const [showSuccessMsg, setShowSuccessMsg] = useState<string | null>(null)
  const [showErrorMsg, setShowErrorMsg] = useState<string | null>(null)
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
    const isTerminalStatus = ['delivered', 'delivered_with_adjustments', 'cancelled', 'not_delivered'].includes(fsStatus)
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
  const isTerminal = ['delivered', 'delivered_with_adjustments', 'cancelled', 'not_delivered'].includes(currentFSStatus)
  const isContactVisible = !['pending_confirmation'].includes(currentFSStatus)
  const commissionRate = distribuidoraUser?.commissionRate ?? 0.015
  const commissionBase = order.deliveredTotal ?? order.total
  const commission = commissionBase * commissionRate
  const canAdjustItems = !isTerminal && ['pending_confirmation', 'confirmed', 'preparing', 'ready_or_on_the_way'].includes(currentFSStatus)
  const adjustmentStage: 'review' | 'operational' = currentFSStatus === 'pending_confirmation' ? 'review' : 'operational'
  const hasPendingItems = order.items.some(item => !item.itemStatus || item.itemStatus === 'pending')
  const effectiveOrderTotal = order.deliveredTotal ?? order.confirmedTotal ?? order.total
  const projectedAdjustmentTotal = Math.max(0, (order.originalTotal ?? order.total) - effectiveOrderTotal)
  const hasAcceptedItems = effectiveOrderTotal > 0
  const canOpenItemAdjustment = (item: OrderItem) => {
    if (!canAdjustItems) return false
    if (adjustmentStage === 'review') return true
    return (item.confirmedQuantity ?? item.quantity) > 0
  }

  const pushSuccess = (message: string) => {
    setShowErrorMsg(null)
    setShowSuccessMsg(message)
    setTimeout(() => setShowSuccessMsg(null), 4000)
  }

  const pushError = (message: string) => {
    setShowSuccessMsg(null)
    setShowErrorMsg(message)
    setTimeout(() => setShowErrorMsg(null), 5000)
  }

  const handleStatusChange = async (nextStatus: DistribStatus, cancellationReason?: string) => {
    setIsUpdating(true)
    try {
      if (nextStatus === 'confirmed') {
        const finalStatus = await confirmOrderAfterItemReview(order.id)
        setCurrentFSStatus(finalStatus === 'cancelled' ? 'cancelled' : 'confirmed')
        pushSuccess(finalStatus === 'cancelled'
          ? 'Pedido cerrado: no quedó ningún producto aceptado.'
          : order.hasItemAdjustments
          ? 'Pedido confirmado con ajustes. El comercio verá el nuevo total.'
          : 'Pedido confirmado. Podés coordinar pago y entrega con el comercio.'
        )
      } else if (nextStatus === 'delivered' && order.hasItemAdjustments) {
        await finalizeOrderWithAdjustments(order.id)
        setCurrentFSStatus('delivered_with_adjustments')
        pushSuccess('Pedido entregado con ajustes. Se generó la comisión sobre el total entregado.')
      } else {
        await updateOrderStatus(order.id, nextStatus, cancellationReason)
        const finalStatus = nextStatus === 'delivered' && order.hasItemAdjustments ? 'delivered_with_adjustments' : nextStatus
        setCurrentFSStatus(finalStatus)
        if (nextStatus === 'delivered') pushSuccess(order.hasItemAdjustments ? 'Pedido entregado con ajustes. Se generó la comisión sobre el total entregado.' : 'Pedido marcado como entregado. Se generó la comisión.')
      }
    } catch (err) {
      console.error('[pedido] updateOrderStatus failed', err)
      pushError('No pudimos actualizar el pedido. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setIsUpdating(false)
      setCancellationModal(null)
    }
  }

  const handleAdjustItem = async (adjustment: { itemStatus: OrderItemStatus; confirmedQuantity?: number; cancelledQuantity?: number; reason?: AdjustmentReason; comment?: string }) => {
    if (!adjustingItem) return
    setIsAdjusting(true)
    try {
      await adjustOrderItem(order.id, adjustingItem.productId, adjustment)
      setAdjustingItem(null)
      pushSuccess('Ajuste guardado. El total se actualizó automáticamente.')
    } catch (err) {
      console.error('[pedido] adjustOrderItem failed', err)
      pushError('No pudimos guardar el ajuste. Intentá de nuevo.')
    } finally {
      setIsAdjusting(false)
    }
  }

  const handleBulkConfirm = async () => {
    setIsBulkConfirming(true)
    try {
      await bulkConfirmItems(order.id)
      pushSuccess(order.hasItemAdjustments ? 'Productos restantes confirmados.' : 'Todos los productos fueron confirmados.')
    } catch (err) {
      console.error('[pedido] bulkConfirmItems failed', err)
      pushError('No pudimos confirmar los productos. Intentá de nuevo.')
    } finally {
      setIsBulkConfirming(false)
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

      {showErrorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold max-w-xs text-center animate-fade-in">
          {showErrorMsg}
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

      {/* Item adjustment sheet */}
      {adjustingItem && (
        <ItemAdjustmentSheet
          item={adjustingItem}
          stage={adjustmentStage}
          onSave={handleAdjustItem}
          onClose={() => setAdjustingItem(null)}
          loading={isAdjusting}
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
        {(currentFSStatus === 'delivered' || currentFSStatus === 'delivered_with_adjustments') && !order.commissionError && (
          <div className={`flex items-center gap-3 p-4 border rounded-2xl ${currentFSStatus === 'delivered_with_adjustments' ? 'bg-teal-50 border-teal-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <BadgePercent className={`h-5 w-5 shrink-0 ${currentFSStatus === 'delivered_with_adjustments' ? 'text-teal-600' : 'text-emerald-600'}`} />
            <div className="flex-1">
              <p className={`font-semibold text-sm ${currentFSStatus === 'delivered_with_adjustments' ? 'text-teal-800' : 'text-emerald-800'}`}>Comisión generada</p>
              <p className={`text-xs mt-0.5 ${currentFSStatus === 'delivered_with_adjustments' ? 'text-teal-700' : 'text-emerald-700'}`}>
                {(commissionRate * 100).toFixed(1)}% sobre {formatCurrency(commissionBase)}
                {currentFSStatus === 'delivered_with_adjustments' && ' (total entregado)'}
              </p>
            </div>
            <p className={`font-heading font-bold ${currentFSStatus === 'delivered_with_adjustments' ? 'text-teal-700' : 'text-emerald-700'}`}>{formatCurrency(commission)}</p>
          </div>
        )}

        {/* Commission error — pending reconciliation */}
        {(currentFSStatus === 'delivered' || currentFSStatus === 'delivered_with_adjustments') && order.commissionError && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Comisión pendiente de revisión</p>
              <p className="text-xs text-amber-700 mt-0.5">Hubo un error al registrar la comisión automáticamente. El equipo de Stockia lo resolverá en breve.</p>
            </div>
          </div>
        )}

        {!isTerminal && currentFSStatus === 'pending_confirmation' && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <Package className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 text-sm">Revisá los productos antes de aceptar</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Tocá cada producto para aceptar la cantidad completa, reducir unidades o excluirlo. Al confirmar, el comercio verá el total aprobado.
              </p>
            </div>
          </div>
        )}

        {!isTerminal && ['confirmed', 'preparing', 'ready_or_on_the_way'].includes(currentFSStatus) && (
          <div className={`flex items-start gap-3 p-4 rounded-2xl border ${order.hasItemAdjustments ? 'bg-teal-50 border-teal-200' : 'bg-blue-50 border-blue-100'}`}>
            <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${order.hasItemAdjustments ? 'text-teal-600' : 'text-blue-500'}`} />
            <div className="flex-1">
              <p className={`font-semibold text-sm ${order.hasItemAdjustments ? 'text-teal-800' : 'text-blue-800'}`}>
                {order.hasItemAdjustments ? 'Pedido confirmado con ajustes' : 'Pedido confirmado'}
              </p>
              <p className={`text-xs mt-0.5 ${order.hasItemAdjustments ? 'text-teal-700' : 'text-blue-700'}`}>
                {order.hasItemAdjustments
                  ? `Total aprobado: ${formatCurrency(order.confirmedTotal ?? order.total)}${projectedAdjustmentTotal > 0 ? `, ajuste de ${formatCurrency(projectedAdjustmentTotal)} sobre lo solicitado.` : '.'}`
                  : 'Los cambios posteriores deberían usarse solo ante faltantes operativos o problemas de entrega.'}
              </p>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A839C]">
              Productos del pedido
            </h2>
            {canAdjustItems && hasPendingItems && (
              <button
                onClick={handleBulkConfirm}
                disabled={isBulkConfirming}
                className="text-xs font-bold text-[#0B1A45] border border-[#0B1A45]/30 px-3 py-1.5 rounded-lg hover:bg-[#0B1A45] hover:text-[#C8FF00] transition-all disabled:opacity-50"
              >
                {isBulkConfirming ? 'Confirmando...' : adjustmentStage === 'review' ? 'Aceptar restantes' : order.hasItemAdjustments ? 'Confirmar restantes' : 'Confirmar todos'}
              </button>
            )}
          </div>
          {canAdjustItems && (
            <p className="text-[11px] text-muted-foreground mb-3">
              {adjustmentStage === 'review'
                ? 'Tocá un producto para aceptar, reducir o excluirlo antes de confirmar el pedido.'
                : 'Tocá un producto solo si apareció un faltante o problema operativo.'}
            </p>
          )}
          <div className="space-y-3">
            {order.items.map((item, i) => {
              const isCancelled = item.itemStatus === 'cancelled' || item.itemStatus === 'not_delivered' || item.itemStatus === 'rejected_by_commerce'
              const displayQty = item.deliveredQuantity ?? item.confirmedQuantity ?? item.quantity
              const displaySubtotal = item.finalSubtotal ?? (item.unitPrice * item.quantity)
              const reasonLabel = item.adjustmentReason ? ADJUSTMENT_REASONS[item.adjustmentReason] : null
              const canEditThisItem = canOpenItemAdjustment(item)
              return (
                <div
                  key={i}
                  className={`${i !== 0 ? 'pt-3 border-t border-[#DFE1E8]/60' : ''} ${canEditThisItem ? 'cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded-xl transition-colors' : ''}`}
                  onClick={canEditThisItem ? () => setAdjustingItem(item) : undefined}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${isCancelled ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <Package className={`h-4 w-4 ${isCancelled ? 'text-red-300' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <p className={`font-bold text-sm leading-tight ${isCancelled ? 'text-gray-400 line-through' : 'text-foreground'}`}>{item.productName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(item.unitPrice)} x {displayQty} un.
                          {item.requestedQuantity && item.requestedQuantity !== displayQty && !isCancelled && (
                            <span className="text-blue-500 ml-1">(de {item.requestedQuantity})</span>
                          )}
                        </p>
                        {item.itemStatus && <div className="mt-1"><ItemStatusPill status={item.itemStatus} /></div>}
                        {reasonLabel && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            Motivo: {reasonLabel}{item.adjustmentComment ? ` · ${item.adjustmentComment}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <p className={`font-heading font-bold text-base shrink-0 ${isCancelled ? 'text-gray-300 line-through' : 'text-foreground'}`}>
                      {formatCurrency(displaySubtotal)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="border-t border-[#DFE1E8]/60 mt-4 pt-4 space-y-2 text-sm">
            {order.hasItemAdjustments ? (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal solicitado</span><span>{formatCurrency(order.originalTotal ?? subtotal)}</span>
                </div>
                {projectedAdjustmentTotal > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Ajuste aplicado</span><span>-{formatCurrency(projectedAdjustmentTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-medium text-muted-foreground">
                  <span>Envío</span><span className="text-green-600 font-bold">Gratis</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[#DFE1E8]/60">
                  <span className="font-bold text-foreground text-base">{currentFSStatus === 'pending_confirmation' ? 'Total a aprobar' : 'Total a cobrar'}</span>
                  <span className="font-heading font-bold text-2xl text-primary">{formatCurrency(order.deliveredTotal ?? order.confirmedTotal ?? order.total)}</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
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
                  loadingLabel="Confirmando revisión..."
                >
                  <CheckCircle className="h-5 w-5" /> {!hasAcceptedItems ? 'Cerrar sin productos' : order.hasItemAdjustments ? 'Confirmar con ajustes' : 'Confirmar pedido'}
                </LoadingButton>
                <button
                  onClick={() => setCancellationModal('cancelled')}
                  className="w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <X className="h-4 w-4" /> Rechazar pedido completo
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
                className={`w-full h-14 rounded-xl text-base font-bold gap-2 shadow-md ${order.hasItemAdjustments ? 'bg-teal-600 hover:bg-teal-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
                onClick={() => handleStatusChange('delivered')}
                loading={isUpdating}
                loadingLabel="Confirmando entrega..."
              >
                <CheckCircle className="h-5 w-5" /> {order.hasItemAdjustments ? 'Confirmar entrega con ajustes' : 'Confirmar entrega'}
              </LoadingButton>
            )}

            {/* Cancel / not delivered — operational exceptions after confirmation */}
            {['confirmed', 'preparing', 'ready_or_on_the_way'].includes(currentFSStatus) && (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground text-center">
                  Usá estas acciones solo si el pedido ya no puede cumplirse.
                </p>
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
                  <X className="h-3.5 w-3.5" /> Cancelar completo
                </button>
                </div>
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
