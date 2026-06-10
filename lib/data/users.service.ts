import { getDocument, setDocument, updateDocument } from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import type { UserRole } from '../types'

// ─── Firestore shape ──────────────────────────────────────────────────────────

export interface FirestoreUser {
  name: string
  email: string
  role: UserRole | 'admin'
  createdAt: unknown
  updatedAt: unknown
}

export interface FirestoreCommerce {
  userId: string
  businessName: string
  phone: string
  address: string
  city: string
  province: string
  provinceSlug?: string
  citySlug?: string
  locationKey?: string
  /** Legacy field from previous prototypes. New forms do not write it. */
  zone?: string
  zoneKey?: string
  /** Real WGS-84 coords. Omitted when not yet geocoded. */
  lat?: number | null
  lng?: number | null
  status: 'active' | 'paused'
  cuit?: string
  businessType?: string
  logoUrl?: string
  /** Internal test accounts — never shown in public marketplace listings. */
  isInternalTest?: boolean
  visibleInMarketplace?: boolean
  createdAt: unknown
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Returns a user's profile document. Returns null if not found. */
export async function getUserById(id: string): Promise<(FirestoreUser & { id: string }) | null> {
  try {
    return await getDocument<FirestoreUser>(COLLECTIONS.users, id)
  } catch (err) {
    console.error('[users.service] getUserById', err)
    return null
  }
}

/**
 * Create or update a user document after registration or login.
 * The document ID matches the Firebase Auth UID.
 * TODO: validate server-side that the calling user's uid matches the id param.
 */
export async function upsertUser(
  id: string,
  data: { name: string; email: string; role: UserRole | 'admin' }
): Promise<void> {
  await setDocument(COLLECTIONS.users, id, data)
}

/**
 * Returns the role of a user. Used to redirect after login.
 *
 * Role → redirect:
 *   'comercio'     → /comercio
 *   'distribuidora' → /distribuidora
 *   'admin'        → /admin
 */
export async function getUserRole(id: string): Promise<UserRole | 'admin' | null> {
  const user = await getUserById(id)
  return user?.role ?? null
}

/** Update the user's display name. */
export async function updateUserName(id: string, name: string): Promise<void> {
  await updateDocument(COLLECTIONS.users, id, { name })
}

// ─── Commerce profile ─────────────────────────────────────────────────────────

/** Returns a commerce profile by its document ID. */
export async function getCommerceById(
  id: string
): Promise<(FirestoreCommerce & { id: string }) | null> {
  try {
    return await getDocument<FirestoreCommerce>(COLLECTIONS.commerces, id)
  } catch (err) {
    console.error('[users.service] getCommerceById', err)
    return null
  }
}

/**
 * Create or update a commerce profile.
 * TODO: ensure only the owning user can write via Firestore rules.
 */
export async function upsertCommerce(
  id: string,
  data: Omit<FirestoreCommerce, 'createdAt'>
): Promise<void> {
  await setDocument(COLLECTIONS.commerces, id, data)
}
