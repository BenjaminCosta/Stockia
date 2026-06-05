import {
  getDocument,
  getDocumentsByField,
  createDocument,
  updateDocument,
} from '../firebase/firestore'
import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/client'
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
  commerceName?: string
  distributorName?: string
  items: OrderItem[]
  subtotal: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  cancellationReason?: string
  commissionAmount?: number
  commissionGenerated: boolean
  commissionError?: boolean
  stockReservationStatus?: 'reserved' | 'released'
  stockReservedAt?: unknown
  stockReleasedAt?: unknown
  stockReleaseReason?: string
  createdAt: unknown
  updatedAt: unknown
  deliveredAt?: unknown
}

interface FirestoreProductForStock {
  distributorId: string
  name?: string
  stock: number
  status: 'active' | 'paused' | 'out_of_stock'
}

export interface StockValidationIssue {
  productId: string
  productName: string
  requested: number
  available: number
  reason: 'missing' | 'wrong_distributor' | 'inactive' | 'insufficient_stock'
}

export class StockValidationError extends Error {
  issues: StockValidationIssue[]

  constructor(issues: StockValidationIssue[]) {
    super('No hay stock suficiente para completar el pedido.')
    this.name = 'StockValidationError'
    this.issues = issues
  }
}

// ─── Status maps (legacy mock → Firestore shape) ──────────────────────────────

const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  pendiente: 'pending_confirmation',
  pagado: 'confirmed',
  en_preparacion: 'preparing',
  entregado: 'delivered',
}

/** Safely converts a Firestore Timestamp, Date, or string to an ISO date string. */
function toISOString(val: unknown): string {
  if (!val) return new Date().toISOString()
  // Firestore Timestamp objects expose .toDate()
  if (typeof (val as any).toDate === 'function') {
    return (val as any).toDate().toISOString()
  }
  if (val instanceof Date) return val.toISOString()
  const d = new Date(String(val))
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}

function toOrder(doc: FirestoreOrder & { id: string }): Order {
  return {
    id: doc.id,
    orderNumber: doc.id.slice(0, 8).toUpperCase(),
    comercioId: doc.commerceId,
    comercioName: doc.commerceName ?? doc.commerceId ?? '',
    distribuidoraId: doc.distributorId,
    distribuidoraName: doc.distributorName ?? doc.distributorId ?? '',
    items: doc.items,
    subtotal: doc.subtotal,
    total: doc.total,
    status: (doc.orderStatus === 'delivered'
      ? 'entregado'
      : doc.orderStatus === 'preparing' || doc.orderStatus === 'ready_or_on_the_way'
      ? 'en_preparacion'
      : doc.orderStatus === 'confirmed'
      ? 'pagado'
      : doc.orderStatus === 'cancelled'
      ? 'cancelado'
      : doc.orderStatus === 'not_delivered'
      ? 'no_entregado'
      : 'pendiente') as Order['status'],
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt),
    zone: '',
    paymentMethod: doc.paymentMethod,
    firestoreStatus: doc.orderStatus,
    cancellationReason: doc.cancellationReason,
    commissionGenerated: doc.commissionGenerated,
    commissionAmount: doc.commissionAmount,
    commissionError: doc.commissionError,
    stockReservationStatus: doc.stockReservationStatus,
    stockReservedAt: doc.stockReservedAt ? toISOString(doc.stockReservedAt) : undefined,
    stockReleasedAt: doc.stockReleasedAt ? toISOString(doc.stockReleasedAt) : undefined,
    stockReleaseReason: doc.stockReleaseReason,
    deliveredAt: doc.deliveredAt ? toISOString(doc.deliveredAt) : undefined,
  }
}

function aggregateItems(items: OrderItem[]) {
  const byProduct = new Map<string, OrderItem>()

  items.forEach(item => {
    const existing = byProduct.get(item.productId)
    byProduct.set(item.productId, existing
      ? { ...existing, quantity: existing.quantity + item.quantity }
      : { ...item }
    )
  })

  return Array.from(byProduct.values())
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
  const aggregatedItems = aggregateItems(data.items)

  // Resolve display names at creation time so order documents are self-contained
  const [commerceDoc, distributorDoc] = await Promise.all([
    getDocument<Record<string, unknown>>(COLLECTIONS.commerces, data.commerceId).catch(() => null),
    getDocument<Record<string, unknown>>(COLLECTIONS.distributors, data.distributorId).catch(() => null),
  ])
  const commerceName = String(commerceDoc?.businessName ?? commerceDoc?.storeName ?? '')
  const distributorName = String(distributorDoc?.companyName ?? '')

  return runTransaction(db, async transaction => {
    const productReads = await Promise.all(aggregatedItems.map(async item => {
      const productRef = doc(db, COLLECTIONS.products, item.productId)
      const snap = await transaction.get(productRef)
      return { item, productRef, snap }
    }))

    const issues: StockValidationIssue[] = []

    productReads.forEach(({ item, snap }) => {
      if (!snap.exists()) {
        issues.push({
          productId: item.productId,
          productName: item.productName,
          requested: item.quantity,
          available: 0,
          reason: 'missing',
        })
        return
      }

      const product = snap.data() as FirestoreProductForStock

      if (product.distributorId !== data.distributorId) {
        issues.push({
          productId: item.productId,
          productName: product.name ?? item.productName,
          requested: item.quantity,
          available: 0,
          reason: 'wrong_distributor',
        })
        return
      }

      if (product.status !== 'active') {
        issues.push({
          productId: item.productId,
          productName: product.name ?? item.productName,
          requested: item.quantity,
          available: product.stock ?? 0,
          reason: 'inactive',
        })
        return
      }

      if (!Number.isFinite(product.stock) || product.stock < item.quantity) {
        issues.push({
          productId: item.productId,
          productName: product.name ?? item.productName,
          requested: item.quantity,
          available: Math.max(0, product.stock ?? 0),
          reason: 'insufficient_stock',
        })
      }
    })

    if (issues.length > 0) throw new StockValidationError(issues)

    productReads.forEach(({ item, snap, productRef }) => {
      const product = snap.data() as FirestoreProductForStock
      const nextStock = product.stock - item.quantity
      transaction.update(productRef, {
        stock: nextStock,
        status: nextStock === 0 ? 'out_of_stock' : 'active',
        updatedAt: serverTimestamp(),
      })
    })

    const orderRef = doc(collection(db, COLLECTIONS.orders))
    transaction.set(orderRef, {
      ...data,
      commerceName,
      distributorName,
      paymentStatus,
      orderStatus: 'pending_confirmation' as OrderStatus,
      commissionGenerated: false,
      stockReservationStatus: 'reserved',
      stockReservedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    return orderRef.id
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
  await runTransaction(db, async transaction => {
    const orderRef = doc(db, COLLECTIONS.orders, id)
    const orderSnap = await transaction.get(orderRef)
    if (!orderSnap.exists()) return

    const order = orderSnap.data() as FirestoreOrder
    const update: Record<string, any> = { orderStatus, updatedAt: serverTimestamp() }

    if (orderStatus === 'delivered') {
      update.deliveredAt = serverTimestamp()
    }

    if (cancellationReason && (orderStatus === 'cancelled' || orderStatus === 'not_delivered')) {
      update.cancellationReason = cancellationReason
    }

    if (
      (orderStatus === 'cancelled' || orderStatus === 'not_delivered') &&
      order.stockReservationStatus === 'reserved'
    ) {
      const itemsToRelease = aggregateItems(order.items ?? [])
      const productReads = await Promise.all(itemsToRelease.map(async item => {
        const productRef = doc(db, COLLECTIONS.products, item.productId)
        const snap = await transaction.get(productRef)
        return { item, productRef, snap }
      }))

      productReads.forEach(({ item, productRef, snap }) => {
        if (!snap.exists()) return
        const product = snap.data() as FirestoreProductForStock
        if (product.distributorId !== order.distributorId) return

        const nextStock = Math.max(0, product.stock ?? 0) + item.quantity
        transaction.update(productRef, {
          stock: nextStock,
          status: nextStock > 0 && product.status === 'out_of_stock' ? 'active' : product.status,
          updatedAt: serverTimestamp(),
        })
      })

      update.stockReservationStatus = 'released'
      update.stockReleasedAt = serverTimestamp()
      update.stockReleaseReason = orderStatus
    }

    transaction.update(orderRef, update)
  })

  // Generate commission on delivery
  if (orderStatus === 'delivered') {
    await generateCommissionForOrder(id)
  }
}

/**
 * Internal helper — creates a commission record when an order is delivered.
 * Called automatically from updateOrderStatus.
 * Retries up to 3 times with exponential backoff. If all attempts fail,
 * sets commissionError: true on the order for manual reconciliation.
 * TODO: replace with a Cloud Function trigger (Firestore onUpdate) for full atomicity.
 */
async function generateCommissionForOrder(orderId: string): Promise<void> {
  const MAX_RETRIES = 3

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const orderDoc = await getDocument<FirestoreOrder>(COLLECTIONS.orders, orderId)
      if (!orderDoc || orderDoc.commissionGenerated) return

      // Use per-distributor rate if set, otherwise default 1.5%
      const distDoc = await getDocument<Record<string, unknown>>(COLLECTIONS.distributors, orderDoc.distributorId).catch(() => null)
      const commissionRate = Number((distDoc as any)?.commissionRate ?? 0.015)
      const commissionAmount = Math.round(orderDoc.total * commissionRate * 100) / 100

      const period = new Date().toISOString().slice(0, 7) // "YYYY-MM"

      await createDocument(COLLECTIONS.commissions, {
        distributorId: orderDoc.distributorId,
        distributorName: orderDoc.distributorName ?? orderDoc.distributorId,
        orderId,
        orderNumber: orderId.slice(0, 8).toUpperCase(),
        orderTotal: orderDoc.total,
        commissionRate,
        commissionAmount,
        status: 'pending',
        period,
      })

      await updateDocument(COLLECTIONS.orders, orderId, {
        commissionGenerated: true,
        commissionAmount,
        commissionError: false,
      })

      return // success
    } catch (err) {
      console.error(`[orders.service] generateCommissionForOrder attempt ${attempt}/${MAX_RETRIES} failed`, err)
      if (attempt < MAX_RETRIES) {
        // Exponential backoff: 500ms, 1000ms, 2000ms
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)))
      } else {
        // All retries exhausted — mark order for manual reconciliation
        try {
          await updateDocument(COLLECTIONS.orders, orderId, { commissionError: true })
        } catch {
          // best-effort
        }
        console.error('[orders.service] generateCommissionForOrder: all retries failed, commissionError flag set on order', orderId)
      }
    }
  }
}
