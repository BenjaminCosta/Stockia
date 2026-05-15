import { getCollection, createDocument, updateDocument } from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import type { PlatformFeedback } from '../types'

// ─── Firestore shape ───────────────────────────────────────────────────────────

interface FirestoreFeedback {
  userId: string
  userRole: 'comercio' | 'distribuidora'
  userName: string
  relatedOrderId?: string
  rating: number
  message: string
  category: 'general' | 'problema' | 'mejora' | 'elogio'
  status: 'new' | 'reviewed' | 'resolved'
  createdAt: unknown
}

function fsToFeedback(doc: FirestoreFeedback & { id: string }): PlatformFeedback {
  return {
    id: doc.id,
    userId: doc.userId,
    userRole: doc.userRole,
    userName: doc.userName ?? '',
    relatedOrderId: doc.relatedOrderId,
    rating: Number(doc.rating) || 0,
    message: doc.message ?? '',
    category: doc.category ?? 'general',
    status: doc.status ?? 'new',
    createdAt: (doc.createdAt as any)?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Get all platform feedback (admin only) */
export async function getAllFeedback(): Promise<PlatformFeedback[]> {
  try {
    const docs = await getCollection<FirestoreFeedback>(COLLECTIONS.platformFeedback)
    return docs
      .map(fsToFeedback)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch {
    return []
  }
}

/** Submit feedback from a user */
export async function createFeedback(data: {
  userId: string
  userRole: 'comercio' | 'distribuidora'
  userName: string
  relatedOrderId?: string
  rating: number
  message: string
  category: 'general' | 'problema' | 'mejora' | 'elogio'
}): Promise<PlatformFeedback> {
  const id = await createDocument(COLLECTIONS.platformFeedback, {
    ...data,
    status: 'new',
  })
  return {
    id,
    ...data,
    status: 'new',
    createdAt: new Date().toISOString(),
  }
}

/** Update feedback status (admin) */
export async function updateFeedbackStatus(
  feedbackId: string,
  status: PlatformFeedback['status']
): Promise<void> {
  await updateDocument(COLLECTIONS.platformFeedback, feedbackId, { status })
}
