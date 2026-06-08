import {
  getCollection,
  getDocument,
  setDocument,
  updateDocument,
  deleteDocument,
} from '@/lib/firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'
import type { MasterProduct, FoodiSeedProduct } from '@/lib/types'

// ─── Firestore shape ───────────────────────────────────────────────────────────

type FirestoreMasterProduct = Omit<MasterProduct, 'id'>

function toMasterProduct(doc: FirestoreMasterProduct & { id: string }): MasterProduct {
  return {
    id: doc.id,
    name: doc.name ?? '',
    normalizedName: doc.normalizedName ?? '',
    brand: doc.brand ?? '',
    categoryId: doc.categoryId ?? 'otros',
    aliases: Array.isArray(doc.aliases) ? doc.aliases : [],
    barcode: doc.barcode,
    unit: doc.unit ?? '',
    imageUrl: doc.imageUrl ?? '',
    fallbackImageUrl: doc.fallbackImageUrl,
    imageSource: doc.imageSource,
    imageStatus: doc.imageStatus,
    status: doc.status ?? 'active',
    source: doc.source,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// ─── Cache ─────────────────────────────────────────────────────────────────────
// In-memory cache so we only load once per session (refreshed on demand).

let _cache: MasterProduct[] | null = null
let _cacheTs = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function isCacheValid(): boolean {
  return _cache !== null && Date.now() - _cacheTs < CACHE_TTL_MS
}

export function invalidateMasterProductsCache(): void {
  _cache = null
  _cacheTs = 0
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Load all master products from Firestore (cached).
 * Use this before matching — call once, reuse the array.
 */
export async function getMasterProducts(): Promise<MasterProduct[]> {
  if (isCacheValid()) return _cache!
  try {
    const docs = await getCollection<FirestoreMasterProduct>(COLLECTIONS.masterProducts)
    _cache = docs.map(toMasterProduct)
    _cacheTs = Date.now()
    return _cache
  } catch (err) {
    console.error('[masterProducts] getCollection failed', err)
    return _cache ?? []
  }
}

export async function getMasterProductById(id: string): Promise<MasterProduct | null> {
  try {
    const doc = await getDocument<FirestoreMasterProduct>(COLLECTIONS.masterProducts, id)
    return doc ? toMasterProduct(doc) : null
  } catch {
    return null
  }
}

export async function createMasterProduct(
  data: Omit<MasterProduct, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<string> {
  const id = data.normalizedName.replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '').slice(0, 80)
    || `mp-${Date.now()}`
  await setDocument(COLLECTIONS.masterProducts, id, data)
  invalidateMasterProductsCache()
  return id
}

export async function updateMasterProduct(
  id: string,
  data: Partial<Omit<MasterProduct, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<void> {
  await updateDocument(COLLECTIONS.masterProducts, id, data)
  invalidateMasterProductsCache()
}

export async function deleteMasterProduct(id: string): Promise<void> {
  await deleteDocument(COLLECTIONS.masterProducts, id)
  invalidateMasterProductsCache()
}

/**
 * Client-side search over a preloaded array.
 * Useful in the admin catalog page where you already have all products loaded.
 */
export function searchMasterProductsLocal(
  all: MasterProduct[],
  query: string,
): MasterProduct[] {
  const q = query.toLowerCase().trim()
  if (!q) return all
  return all.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.normalizedName.includes(q) ||
    p.brand.toLowerCase().includes(q) ||
    p.aliases.some(a => a.includes(q)) ||
    p.categoryId.includes(q),
  )
}

/**
 * Seed Firestore from FooDI-ML generated data.
 * Skips products that already exist (by id).
 * Only callable from admin panel.
 *
 * @returns { ok: number, skipped: number }
 */
export async function seedFoodiProducts(
  products: FoodiSeedProduct[],
): Promise<{ ok: number; skipped: number }> {
  let ok = 0
  let skipped = 0

  // Load existing ids to skip duplicates
  const existing = await getMasterProducts()
  const existingIds = new Set(existing.map(p => p.id))

  for (const p of products) {
    if (existingIds.has(p.id)) {
      skipped++
      continue
    }
    try {
      await setDocument(COLLECTIONS.masterProducts, p.id, {
        name: p.name,
        normalizedName: p.normalizedName,
        brand: p.brand,
        categoryId: p.categoryId,
        aliases: p.aliases,
        barcode: '',
        unit: p.unit,
        imageUrl: p.imageUrl,
        imageSource: p.imageSource,
        imageStatus: p.imageStatus,
        status: p.status === 'approved' ? 'active' : 'review',
        source: p.source,
      } satisfies Partial<FirestoreMasterProduct>)
      ok++
    } catch (err) {
      console.error('[masterProducts] seed failed for', p.id, err)
    }
  }

  invalidateMasterProductsCache()
  return { ok, skipped }
}
