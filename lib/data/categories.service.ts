import { getCollection } from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import { categories as mockCategories } from '../mock-data'
import type { Category } from '../types'

// ─── Firestore shape ──────────────────────────────────────────────────────────

export interface FirestoreCategory {
  name: string
  iconName: string
  image?: string
  order?: number
  visible?: boolean
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Returns all visible categories.
 * Uses Firestore if data is available; falls back to mock data otherwise.
 * Categories with visible === false (set from admin) are excluded.
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const docs = await getCollection<FirestoreCategory>(COLLECTIONS.categories)
    if (docs.length > 0) {
      const mockByName = new Map(mockCategories.map(c => [c.name, c]))
      return docs
        .filter(d => d.visible !== false)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        .map(d => ({
          id: d.id,
          name: d.name,
          iconName: d.iconName,
          image: d.image || mockByName.get(d.name)?.image || '',
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
      return { id: doc.id, name: doc.name, iconName: doc.iconName, image: doc.image ?? '' }
    }
  } catch {
    // fall through
  }
  return mockCategories.find(c => c.id === id) ?? null
}
