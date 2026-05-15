import { getCollection, getDocument, getDocumentsByField, createDocument, updateDocument } from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import { Review, DistributorRatingSummary, CommerceHistory } from '@/lib/types'

// ─── Firestore shape ───────────────────────────────────────────────────────────

interface FirestoreReview {
  orderId: string
  orderNumber: string
  distributorId: string
  distributorName?: string
  commerceId: string
  commerceName?: string
  ratingGeneral: number
  ratingFulfillment: number
  ratingDelivery: number
  ratingProductCondition: number
  ratingCommunication: number
  comment: string
  status: 'visible' | 'hidden' | 'reported'
  createdAt: unknown
}

function fsToReview(doc: FirestoreReview & { id: string }): Review {
  return {
    id: doc.id,
    orderId: doc.orderId,
    orderNumber: doc.orderNumber ?? doc.orderId?.slice(0, 8).toUpperCase(),
    distributorId: doc.distributorId,
    distributorName: doc.distributorName ?? doc.distributorId ?? '',
    commerceId: doc.commerceId,
    commerceName: doc.commerceName ?? doc.commerceId ?? '',
    ratingGeneral: Number(doc.ratingGeneral) || 0,
    ratingFulfillment: Number(doc.ratingFulfillment) || 0,
    ratingDelivery: Number(doc.ratingDelivery) || 0,
    ratingProductCondition: Number(doc.ratingProductCondition) || 0,
    ratingCommunication: Number(doc.ratingCommunication) || 0,
    comment: doc.comment ?? '',
    status: doc.status ?? 'visible',
    createdAt: (doc.createdAt as any)?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeSummary(reviews: Review[]): DistributorRatingSummary {
  const visible = reviews.filter(r => r.status === 'visible')
  if (visible.length === 0) {
    return { averageGeneral: 0, averageFulfillment: 0, averageDelivery: 0, averageProductCondition: 0, averageCommunication: 0, reviewCount: 0 }
  }
  const avg = (field: keyof Pick<Review, 'ratingGeneral' | 'ratingFulfillment' | 'ratingDelivery' | 'ratingProductCondition' | 'ratingCommunication'>) =>
    Math.round((visible.reduce((s, r) => s + r[field], 0) / visible.length) * 10) / 10
  return {
    averageGeneral: avg('ratingGeneral'),
    averageFulfillment: avg('ratingFulfillment'),
    averageDelivery: avg('ratingDelivery'),
    averageProductCondition: avg('ratingProductCondition'),
    averageCommunication: avg('ratingCommunication'),
    reviewCount: visible.length,
  }
}

// ─── Service functions ────────────────────────────────────────────────────────

/** Get all visible reviews for a distributor */
export async function getReviewsByDistributor(distributorId: string): Promise<Review[]> {
  try {
    const docs = await getDocumentsByField<FirestoreReview>(COLLECTIONS.reviews, 'distributorId', '==', distributorId)
    if (docs.length > 0) {
      return docs
        .map(fsToReview)
        .filter(r => r.status === 'visible')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  } catch {
    // fall through
  }
  return []
}

/** Get all reviews for a distributor (admin — includes hidden) */
export async function getAllReviewsByDistributor(distributorId: string): Promise<Review[]> {
  try {
    const docs = await getDocumentsByField<FirestoreReview>(COLLECTIONS.reviews, 'distributorId', '==', distributorId)
    if (docs.length > 0) return docs.map(fsToReview)
  } catch {
    // fall through
  }
  return []
}

/** Get all reviews (admin) */
export async function getAllReviews(): Promise<Review[]> {
  try {
    const docs = await getCollection<FirestoreReview>(COLLECTIONS.reviews)
    return docs
      .map(fsToReview)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    // fall through
  }
  return []
}

/** Check if a specific order already has a review */
export async function getReviewByOrder(orderId: string): Promise<Review | null> {
  try {
    const docs = await getDocumentsByField<FirestoreReview>(COLLECTIONS.reviews, 'orderId', '==', orderId)
    if (docs.length > 0) return fsToReview(docs[0])
  } catch {
    // fall through
  }
  return null
}

/** Check synchronously — always false when using Firestore (use getReviewByOrder for async check) */
export function hasReviewForOrder(_orderId: string): boolean {
  return false
}

/** Get rating summary for a distributor */
export async function getDistributorRatingSummary(distributorId: string): Promise<DistributorRatingSummary> {
  const reviews = await getReviewsByDistributor(distributorId)
  return computeSummary(reviews)
}

/** Create a new review */
export async function createReview(data: {
  orderId: string
  orderNumber: string
  distributorId: string
  distributorName: string
  commerceId: string
  commerceName: string
  ratingGeneral: number
  ratingFulfillment: number
  ratingDelivery: number
  ratingProductCondition: number
  ratingCommunication: number
  comment: string
}): Promise<Review> {
  const id = await createDocument(COLLECTIONS.reviews, {
    ...data,
    status: 'visible',
  })
  return {
    id,
    ...data,
    status: 'visible',
    createdAt: new Date().toISOString(),
  }
}

/** Moderate a review (admin) */
export async function moderateReview(reviewId: string, visible: boolean): Promise<void> {
  await updateDocument(COLLECTIONS.reviews, reviewId, { status: visible ? 'visible' : 'hidden' })
}

/** Get commerce history (for distribuidora view — derived from delivered orders) */
export async function getCommerceHistory(_commerceId: string): Promise<CommerceHistory | null> {
  return null
}

/** Get all commerce histories (derived from orders for the given distributor) */
export async function getCommerceHistoriesByDistributor(distributorId: string): Promise<CommerceHistory[]> {
  try {
    const orders = await getDocumentsByField<Record<string, unknown>>(
      COLLECTIONS.orders,
      'distributorId',
      '==',
      distributorId
    )
    if (orders.length === 0) return []

    const map: Record<string, CommerceHistory> = {}
    for (const o of orders) {
      const cId = String(o.commerceId ?? '')
      const cName = String(o.commerceName ?? o.commerceId ?? '')
      if (!cId) continue
      if (!map[cId]) {
        map[cId] = {
          commerceId: cId,
          commerceName: cName,
          completedOrders: 0,
          cancelledOrders: 0,
          notDeliveredOrders: 0,
          reportedIssues: 0,
          lastOrderAt: String(o.createdAt ?? new Date().toISOString()),
          joinedAt: String(o.createdAt ?? new Date().toISOString()),
        }
      }
      const h = map[cId]
      const status = String(o.orderStatus ?? '')
      if (status === 'delivered') h.completedOrders++
      else if (status === 'cancelled') h.cancelledOrders++
      else if (status === 'not_delivered') h.notDeliveredOrders++
      const createdAt = String(o.createdAt ?? '')
      if (createdAt > h.lastOrderAt) h.lastOrderAt = createdAt
      if (createdAt < h.joinedAt) h.joinedAt = createdAt
    }
    return Object.values(map)
  } catch {
    return []
  }
}
