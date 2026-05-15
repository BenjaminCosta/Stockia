import { getCollection, getDocumentsByField, createDocument, updateDocument } from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import type { CommerceReview } from '../types'

// ─── Firestore shape ───────────────────────────────────────────────────────────

interface FirestoreCommerceReview {
  orderId: string
  orderNumber?: string
  distributorId: string
  distributorName?: string
  commerceId: string
  commerceName?: string
  ratingGeneral: number
  ratingPayment: number
  ratingReception: number
  ratingCommunication: number
  ratingReliability: number
  comment: string
  status: 'visible' | 'hidden' | 'reported'
  createdAt: unknown
}

function fsToCommerceReview(doc: FirestoreCommerceReview & { id: string }): CommerceReview {
  return {
    id: doc.id,
    orderId: doc.orderId,
    orderNumber: doc.orderNumber ?? doc.orderId?.slice(0, 8).toUpperCase(),
    distributorId: doc.distributorId,
    distributorName: doc.distributorName ?? doc.distributorId ?? '',
    commerceId: doc.commerceId,
    commerceName: doc.commerceName ?? doc.commerceId ?? '',
    ratingGeneral: Number(doc.ratingGeneral) || 0,
    ratingPayment: Number(doc.ratingPayment) || 0,
    ratingReception: Number(doc.ratingReception) || 0,
    ratingCommunication: Number(doc.ratingCommunication) || 0,
    ratingReliability: Number(doc.ratingReliability) || 0,
    comment: doc.comment ?? '',
    status: doc.status ?? 'visible',
    createdAt: (doc.createdAt as any)?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export interface CommerceRatingSummary {
  averageGeneral: number
  averagePayment: number
  averageReception: number
  averageCommunication: number
  averageReliability: number
  reviewCount: number
}

function computeSummary(reviews: CommerceReview[]): CommerceRatingSummary {
  const visible = reviews.filter(r => r.status === 'visible')
  if (visible.length === 0) {
    return { averageGeneral: 0, averagePayment: 0, averageReception: 0, averageCommunication: 0, averageReliability: 0, reviewCount: 0 }
  }
  const avg = (field: keyof Pick<CommerceReview, 'ratingGeneral' | 'ratingPayment' | 'ratingReception' | 'ratingCommunication' | 'ratingReliability'>) =>
    Math.round((visible.reduce((s, r) => s + r[field], 0) / visible.length) * 10) / 10
  return {
    averageGeneral: avg('ratingGeneral'),
    averagePayment: avg('ratingPayment'),
    averageReception: avg('ratingReception'),
    averageCommunication: avg('ratingCommunication'),
    averageReliability: avg('ratingReliability'),
    reviewCount: visible.length,
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Get all visible reviews for a commerce (any authenticated distributor can see) */
export async function getCommerceReviews(commerceId: string): Promise<CommerceReview[]> {
  try {
    const docs = await getDocumentsByField<FirestoreCommerceReview>(
      COLLECTIONS.commerceReviews,
      'commerceId',
      '==',
      commerceId
    )
    return docs
      .map(fsToCommerceReview)
      .filter(r => r.status === 'visible')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

/** Get all reviews for a commerce, including hidden (admin) */
export async function getAllCommerceReviewsByCommerce(commerceId: string): Promise<CommerceReview[]> {
  try {
    const docs = await getDocumentsByField<FirestoreCommerceReview>(
      COLLECTIONS.commerceReviews,
      'commerceId',
      '==',
      commerceId
    )
    return docs.map(fsToCommerceReview)
  } catch {
    return []
  }
}

/** Get all commerce reviews (admin panel) */
export async function getAllCommerceReviews(): Promise<CommerceReview[]> {
  try {
    const docs = await getCollection<FirestoreCommerceReview>(COLLECTIONS.commerceReviews)
    return docs
      .map(fsToCommerceReview)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

/** Check if a distributor already reviewed a specific order */
export async function getCommerceReviewByOrder(orderId: string): Promise<CommerceReview | null> {
  try {
    const docs = await getDocumentsByField<FirestoreCommerceReview>(
      COLLECTIONS.commerceReviews,
      'orderId',
      '==',
      orderId
    )
    if (docs.length > 0) return fsToCommerceReview(docs[0])
  } catch {
    // fall through
  }
  return null
}

/** Get rating summary for a commerce */
export async function getCommerceRatingSummary(commerceId: string): Promise<CommerceRatingSummary> {
  const reviews = await getCommerceReviews(commerceId)
  return computeSummary(reviews)
}

/** Create a commerce review (distributor rates a commerce) */
export async function createCommerceReview(data: {
  orderId: string
  orderNumber: string
  distributorId: string
  distributorName: string
  commerceId: string
  commerceName: string
  ratingGeneral: number
  ratingPayment: number
  ratingReception: number
  ratingCommunication: number
  ratingReliability: number
  comment: string
}): Promise<CommerceReview> {
  const id = await createDocument(COLLECTIONS.commerceReviews, {
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

/** Moderate a commerce review (admin) */
export async function moderateCommerceReview(reviewId: string, visible: boolean): Promise<void> {
  await updateDocument(COLLECTIONS.commerceReviews, reviewId, {
    status: visible ? 'visible' : 'hidden',
  })
}
