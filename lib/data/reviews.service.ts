// Reviews service — mock data, ready to swap for Firebase
// To connect Firebase: replace each function body with Firestore calls

import { Review, DistributorRatingSummary, CommerceHistory } from '@/lib/types'

// ─── Mock data ────────────────────────────────────────────────────────────────

export const mockReviews: Review[] = [
  {
    id: 'rev-1',
    orderId: 'order-1',
    orderNumber: 'STK-001-2024',
    distributorId: 'dist-1',
    distributorName: 'Distribuidora Norte',
    commerceId: 'com-1',
    commerceName: 'Almacén Don Pedro',
    ratingGeneral: 5,
    ratingFulfillment: 5,
    ratingDelivery: 4,
    ratingProductCondition: 5,
    ratingCommunication: 5,
    comment: 'Excelente servicio, llegaron todos los productos en perfecto estado y antes del tiempo acordado.',
    status: 'visible',
    createdAt: '2024-11-10T10:00:00Z',
  },
  {
    id: 'rev-2',
    orderId: 'order-2',
    orderNumber: 'STK-002-2024',
    distributorId: 'dist-1',
    distributorName: 'Distribuidora Norte',
    commerceId: 'com-2',
    commerceName: 'Kiosco María',
    ratingGeneral: 4,
    ratingFulfillment: 4,
    ratingDelivery: 3,
    ratingProductCondition: 4,
    ratingCommunication: 5,
    comment: 'Muy buena atención, aunque tardaron un poco más de lo previsto. Los productos estaban bien.',
    status: 'visible',
    createdAt: '2024-11-05T14:30:00Z',
  },
  {
    id: 'rev-3',
    orderId: 'order-3',
    orderNumber: 'STK-003-2024',
    distributorId: 'dist-1',
    distributorName: 'Distribuidora Norte',
    commerceId: 'com-3',
    commerceName: 'Mini Market El Sol',
    ratingGeneral: 5,
    ratingFulfillment: 5,
    ratingDelivery: 5,
    ratingProductCondition: 5,
    ratingCommunication: 4,
    comment: 'Todo perfecto, pedido completo y en tiempo. Lo recomiendo.',
    status: 'visible',
    createdAt: '2024-10-28T09:15:00Z',
  },
  {
    id: 'rev-4',
    orderId: 'order-4',
    orderNumber: 'STK-004-2024',
    distributorId: 'dist-2',
    distributorName: 'Distribuidora Sur',
    commerceId: 'com-1',
    commerceName: 'Almacén Don Pedro',
    ratingGeneral: 3,
    ratingFulfillment: 3,
    ratingDelivery: 2,
    ratingProductCondition: 4,
    ratingCommunication: 3,
    comment: 'Llegó tarde y faltaron 2 productos. Me avisaron pero esperaba que el pedido esté completo.',
    status: 'visible',
    createdAt: '2024-10-20T16:00:00Z',
  },
  {
    id: 'rev-5',
    orderId: 'order-5',
    orderNumber: 'STK-005-2024',
    distributorId: 'dist-2',
    distributorName: 'Distribuidora Sur',
    commerceId: 'com-4',
    commerceName: 'Supermercado Familiar',
    ratingGeneral: 4,
    ratingFulfillment: 4,
    ratingDelivery: 4,
    ratingProductCondition: 5,
    ratingCommunication: 4,
    comment: '',
    status: 'visible',
    createdAt: '2024-10-15T11:00:00Z',
  },
  {
    id: 'rev-6',
    orderId: 'order-6',
    orderNumber: 'STK-006-2024',
    distributorId: 'dist-1',
    distributorName: 'Distribuidora Norte',
    commerceId: 'com-5',
    commerceName: 'Despensa La Esquina',
    ratingGeneral: 2,
    ratingFulfillment: 2,
    ratingDelivery: 1,
    ratingProductCondition: 3,
    ratingCommunication: 2,
    comment: 'No me avisaron del retraso y el pedido llegó incompleto. Espero que mejoren.',
    status: 'hidden',
    createdAt: '2024-10-08T08:00:00Z',
  },
]

// Mock commerce histories
const mockCommerceHistories: CommerceHistory[] = [
  {
    commerceId: 'com-1',
    commerceName: 'Almacén Don Pedro',
    completedOrders: 14,
    cancelledOrders: 1,
    notDeliveredOrders: 0,
    reportedIssues: 0,
    lastOrderAt: '2024-11-10T10:00:00Z',
    joinedAt: '2024-01-15T00:00:00Z',
  },
  {
    commerceId: 'com-2',
    commerceName: 'Kiosco María',
    completedOrders: 8,
    cancelledOrders: 0,
    notDeliveredOrders: 0,
    reportedIssues: 0,
    lastOrderAt: '2024-11-05T14:30:00Z',
    joinedAt: '2024-03-10T00:00:00Z',
  },
  {
    commerceId: 'com-3',
    commerceName: 'Mini Market El Sol',
    completedOrders: 22,
    cancelledOrders: 2,
    notDeliveredOrders: 1,
    reportedIssues: 1,
    lastOrderAt: '2024-10-28T09:15:00Z',
    joinedAt: '2023-11-20T00:00:00Z',
  },
  {
    commerceId: 'com-4',
    commerceName: 'Supermercado Familiar',
    completedOrders: 5,
    cancelledOrders: 0,
    notDeliveredOrders: 0,
    reportedIssues: 0,
    lastOrderAt: '2024-10-15T11:00:00Z',
    joinedAt: '2024-06-01T00:00:00Z',
  },
]

// Set of orderIds that already have a review (to prevent duplicates)
const reviewedOrderIds = new Set(mockReviews.map(r => r.orderId))

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
  // Firebase: getDocs(query(collection(db, 'reviews'), where('distributorId', '==', distributorId), where('status', '==', 'visible')))
  await new Promise(r => setTimeout(r, 100))
  return mockReviews.filter(r => r.distributorId === distributorId && r.status === 'visible')
}

/** Get all reviews for a distributor (admin — includes hidden) */
export async function getAllReviewsByDistributor(distributorId: string): Promise<Review[]> {
  await new Promise(r => setTimeout(r, 100))
  return mockReviews.filter(r => r.distributorId === distributorId)
}

/** Get all reviews (admin) */
export async function getAllReviews(): Promise<Review[]> {
  await new Promise(r => setTimeout(r, 100))
  return [...mockReviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

/** Check if a specific order already has a review */
export async function getReviewByOrder(orderId: string): Promise<Review | null> {
  // Firebase: getDocs(query(collection(db, 'reviews'), where('orderId', '==', orderId), limit(1)))
  await new Promise(r => setTimeout(r, 50))
  return mockReviews.find(r => r.orderId === orderId) ?? null
}

/** Check synchronously (for UI without async) */
export function hasReviewForOrder(orderId: string): boolean {
  return reviewedOrderIds.has(orderId)
}

/** Get rating summary for a distributor */
export async function getDistributorRatingSummary(distributorId: string): Promise<DistributorRatingSummary> {
  await new Promise(r => setTimeout(r, 80))
  const reviews = mockReviews.filter(r => r.distributorId === distributorId)
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
  // Firebase: addDoc(collection(db, 'reviews'), { ...data, status: 'visible', createdAt: serverTimestamp() })
  await new Promise(r => setTimeout(r, 300))
  const review: Review = {
    id: `rev-${Date.now()}`,
    ...data,
    status: 'visible',
    createdAt: new Date().toISOString(),
  }
  mockReviews.push(review)
  reviewedOrderIds.add(data.orderId)
  return review
}

/** Moderate a review (admin) */
export async function moderateReview(reviewId: string, visible: boolean): Promise<void> {
  // Firebase: updateDoc(doc(db, 'reviews', reviewId), { status: visible ? 'visible' : 'hidden' })
  await new Promise(r => setTimeout(r, 200))
  const review = mockReviews.find(r => r.id === reviewId)
  if (review) review.status = visible ? 'visible' : 'hidden'
}

/** Get commerce history (for distribuidora view) */
export async function getCommerceHistory(commerceId: string): Promise<CommerceHistory | null> {
  // Firebase: getDoc(doc(db, 'commerceHistories', commerceId))
  await new Promise(r => setTimeout(r, 100))
  return mockCommerceHistories.find(h => h.commerceId === commerceId) ?? null
}

/** Get all commerce histories (for distribuidora — all their customers) */
export async function getCommerceHistoriesByDistributor(_distributorId: string): Promise<CommerceHistory[]> {
  // Firebase: query based on orders where distributorId == _distributorId, aggregate per commerceId
  await new Promise(r => setTimeout(r, 150))
  return mockCommerceHistories
}
