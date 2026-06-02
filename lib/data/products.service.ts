import {
  getCollection,
  getDocument,
  getDocumentsByField,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import { mockProducts, getProductsByDistribuidora } from '../mock-data'
import type { Product } from '../types'

// ─── Firestore shape ──────────────────────────────────────────────────────────

export interface FirestoreProduct {
  distributorId: string
  name: string
  description: string
  categoryId: string
  brand?: string
  sku?: string
  price: number
  stock: number
  unit?: string
  imageUrl?: string
  status: 'active' | 'paused' | 'out_of_stock'
  isOffer?: boolean
  createdAt: unknown
  updatedAt: unknown
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toProduct(doc: FirestoreProduct & { id: string }): Product {
  return {
    id: doc.id,
    distribuidoraId: doc.distributorId,
    name: doc.name,
    category: doc.categoryId,
    price: doc.price,
    stock: doc.stock,
    description: doc.description,
    imageUrl: doc.imageUrl,
    sku: doc.sku,
    active: doc.status === 'active',
    status: doc.status ?? 'active',
    rating: 0,
    reviewCount: 0,
    isOffer: doc.isOffer ?? false,
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Returns active + out_of_stock products for a distributor (buyer-facing). */
export async function getProductsByDistributor(distributorId: string): Promise<Product[]> {
  try {
    const docs = await getDocumentsByField<FirestoreProduct>(
      COLLECTIONS.products,
      'distributorId',
      '==',
      distributorId
    )
    if (docs.length > 0) {
      return docs.filter(d => d.status !== 'paused').map(toProduct)
    }
  } catch {
    // fall through
  }
  return getProductsByDistribuidora(distributorId)
}

/** Returns ALL products for a distributor including paused (admin panel use only). */
export async function getProductsByDistributorAll(distributorId: string): Promise<Product[]> {
  try {
    const docs = await getDocumentsByField<FirestoreProduct>(
      COLLECTIONS.products,
      'distributorId',
      '==',
      distributorId
    )
    if (docs.length > 0) return docs.map(toProduct)
  } catch {
    // fall through
  }
  return getProductsByDistribuidora(distributorId)
}

/** Returns all products (admin / global search). */
export async function getAllProducts(): Promise<Product[]> {
  try {
    const docs = await getCollection<FirestoreProduct>(COLLECTIONS.products)
    if (docs.length > 0) return docs.map(toProduct)
  } catch {
    // fall through
  }
  return mockProducts
}

/** Returns a single product by ID. */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    const doc = await getDocument<FirestoreProduct>(COLLECTIONS.products, id)
    if (doc) return toProduct(doc)
  } catch {
    // fall through
  }
  return mockProducts.find(p => p.id === id) ?? null
}

/**
 * Search products by name, brand, or SKU (case-insensitive client-side filter).
 * For large catalogs, move this to a server-side full-text solution later.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const all = await getAllProducts()
  const q = query.toLowerCase()
  return all.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
  )
}

/**
 * Filter products by category name/id.
 * If products come from Firestore, categoryId is used; mock data uses category string.
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const all = await getAllProducts()
  return all.filter(
    p => p.category === category
  )
}

/**
 * Create a new product. Only callable from the distribuidora panel.
 * TODO: add auth check — only the owning distributor should write.
 */
export async function createProduct(
  data: Omit<FirestoreProduct, 'createdAt' | 'updatedAt'>
): Promise<string> {
  return createDocument(COLLECTIONS.products, { ...data, status: data.status ?? 'active' })
}

/**
 * Update product fields (price, stock, status, etc.).
 * TODO: validate that the calling user owns this product.
 */
export async function updateProduct(
  id: string,
  data: Partial<Omit<FirestoreProduct, 'createdAt' | 'updatedAt'>>
): Promise<void> {
  await updateDocument(COLLECTIONS.products, id, data)
}

/** Delete a product. Use with care — prefer status: 'paused' instead. */
export async function deleteProduct(id: string): Promise<void> {
  await deleteDocument(COLLECTIONS.products, id)
}
