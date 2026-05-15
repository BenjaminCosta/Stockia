import { getCollection } from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import { categories as mockCategories } from '../mock-data'
import type { Category } from '../types'

// ─── Firestore shape ──────────────────────────────────────────────────────────

export interface FirestoreCategory {
  name: string
  iconName: string
  image: string
  order?: number
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Returns all categories.
 * Uses Firestore if data is available; falls back to mock data otherwise.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const docs = await getCollection<FirestoreCategory>(COLLECTIONS.categories)
    if (docs.length > 0) {
      return docs.map(d => ({
        id: d.id,
        name: d.name,
        iconName: d.iconName,
        image: d.image,
      }))
    }
  } catch {
    // Firestore unavailable — fall through to mock data
  }
  return mockCategories
}

/**
 * Returns a single category by ID.
 * Falls back to mock data lookup if Firestore returns nothing.
 */
export async function getCategoryById(id: string): Promise<Category | null> {
  try {
    const { getDocument } = await import('../firebase/firestore')
    const doc = await getDocument<FirestoreCategory>(COLLECTIONS.categories, id)
    if (doc) {
      return { id: doc.id, name: doc.name, iconName: doc.iconName, image: doc.image }
    }
  } catch {
    // fall through
  }
  return mockCategories.find(c => c.id === id) ?? null
}
