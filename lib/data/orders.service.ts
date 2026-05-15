import {
  getDocument,
  getDocumentsByField,
  createDocument,
  updateDocument,
} from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import { mockOrders, getOrdersByComercio, getOrdersByDistribuidora } from '../mock-data'
import type { Order, OrderItem } from '../types'

// ─── Firestore shape ──────────────────────────────────────────────────────────

export type PaymentMethod = 'mercado_pago' | 'external'
export type PaymentStatus = 'pending' | 'approved' | 'external_agreed' | 'failed'
export type OrderStatus =
  | 'pending_confirmation'
  | 'confirmed'
  | 'preparing'
  | 'ready_or_on_the_way'
  | 'delivered'
  | 'cancelled'
  | 'not_delivered'

export interface FirestoreOrder {
  commerceId: string
  distributorId: string
  items: OrderItem[]
  subtotal: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  cancellationReason?: string
  commissionAmount?: number
  commissionGenerated: boolean
  createdAt: unknown
  updatedAt: unknown
  deliveredAt?: unknown
}

// ─── Status maps (legacy mock → Firestore shape) ──────────────────────────────

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  pendiente: 'pending_confirmation',
  pagado: 'confirmed',
  en_preparacion: 'preparing',
  entregado: 'delivered',
}

function toOrder(doc: FirestoreOrder & { id: string }): Order {
  return {
    id: doc.id,
    orderNumber: doc.id.slice(0, 8).toUpperCase(),
    comercioId: doc.commerceId,
    comercioName: '',   // TODO: join with users/commerces collection
    distribuidoraId: doc.distributorId,
    distribuidoraName: '', // TODO: join with distributors collection
    items: doc.items,
    subtotal: doc.subtotal,
    total: doc.total,
    status: (doc.orderStatus === 'delivered'
      ? 'entregado'
      : doc.orderStatus === 'preparing'
      ? 'en_preparacion'
      : doc.orderStatus === 'confirmed'
      ? 'pagado'
      : 'pendiente') as Order['status'],
    createdAt: String(doc.createdAt),
    updatedAt: String(doc.updatedAt),
    zone: '',
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Returns all orders for a commerce. */
export async function getOrdersByCommerce(commerceId: string): Promise<Order[]> {
  try {
    const docs = await getDocumentsByField<FirestoreOrder>(
      COLLECTIONS.orders,
      'commerceId',
      '==',
      commerceId
    )
    if (docs.length > 0) return docs.map(toOrder)
  } catch {
    // fall through
  }
  return getOrdersByComercio(commerceId)
}

/** Returns all orders for a distributor. */
export async function getOrdersByDistributor(distributorId: string): Promise<Order[]> {
  try {
    const docs = await getDocumentsByField<FirestoreOrder>(
      COLLECTIONS.orders,
      'distributorId',
      '==',
      distributorId
    )
    if (docs.length > 0) return docs.map(toOrder)
  } catch {
    // fall through
  }
  return getOrdersByDistribuidora(distributorId)
}

/** Returns a single order by ID. */
export async function getOrderById(id: string): Promise<Order | null> {
  try {
    const doc = await getDocument<FirestoreOrder>(COLLECTIONS.orders, id)
    if (doc) return toOrder(doc)
  } catch {
    // fall through
  }
  return mockOrders.find(o => o.id === id) ?? null
}

/**
 * Create a new order.
 *
 * Payment logic:
 * - mercado_pago  → paymentStatus: 'pending', orderStatus: 'pending_confirmation'
 * - external      → paymentStatus: 'external_agreed', orderStatus: 'pending_confirmation'
 */
export async function createOrder(data: {
  commerceId: string
  distributorId: string
  items: OrderItem[]
  subtotal: number
  total: number
  paymentMethod: PaymentMethod
}): Promise<string> {
  const paymentStatus: PaymentStatus =
    data.paymentMethod === 'mercado_pago' ? 'pending' : 'external_agreed'

  return createDocument(COLLECTIONS.orders, {
    ...data,
    paymentStatus,
    orderStatus: 'pending_confirmation' as OrderStatus,
    commissionGenerated: false,
  })
}

/**
 * Update the status of an order (distributor panel action).
 * When status is 'delivered', triggers commission generation.
 * TODO: move commission generation to a Cloud Function trigger for atomicity.
 */
export async function updateOrderStatus(
  id: string,
  orderStatus: OrderStatus,
  cancellationReason?: string
): Promise<void> {
  const update: Record<string, unknown> = { orderStatus }

  if (orderStatus === 'delivered') {
    update.deliveredAt = new Date().toISOString()
  }

  if (cancellationReason && (orderStatus === 'cancelled' || orderStatus === 'not_delivered')) {
    update.cancellationReason = cancellationReason
  }

  await updateDocument(COLLECTIONS.orders, id, update)

  // Generate commission on delivery
  if (orderStatus === 'delivered') {
    await generateCommissionForOrder(id)
  }
}

/**
 * Internal helper — creates a commission record when an order is delivered.
 * Called automatically from updateOrderStatus.
 * TODO: replace with a Cloud Function trigger (Firestore onUpdate) for reliability.
 */
async function generateCommissionForOrder(orderId: string): Promise<void> {
  try {
    const doc = await getDocument<FirestoreOrder>(COLLECTIONS.orders, orderId)
    if (!doc || doc.commissionGenerated) return

    const COMMISSION_RATE = 0.015
    const commissionAmount = doc.total * COMMISSION_RATE

    const period = new Date().toISOString().slice(0, 7) // "YYYY-MM"

    await createDocument(COLLECTIONS.commissions, {
      distributorId: doc.distributorId,
      orderId,
      orderTotal: doc.total,
      commissionRate: COMMISSION_RATE,
      commissionAmount,
      status: 'pending',
      period,
    })

    await updateDocument(COLLECTIONS.orders, orderId, {
      commissionGenerated: true,
      commissionAmount,
    })
  } catch (err) {
    console.error('[orders.service] generateCommissionForOrder failed', err)
    // Non-fatal — commission can be reconciled manually
  }
}
