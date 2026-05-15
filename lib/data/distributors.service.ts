import { getCollection, getDocument, getDocumentsByField, updateDocument, setDocument } from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import { mockDistribuidoras, mockDistributorCards } from '../mock-data'
import { getDistanceKm, formatDistance, isWithinCoverage, type LatLng } from '../firebase/geo'
import type { Distribuidora, DistributorCard } from '../types'

// ─── Firestore shape ──────────────────────────────────────────────────────────

export interface FirestoreDistributor {
  userId: string
  companyName: string
  logoUrl?: string
  phone: string
  address: string
  city: string
  province: string
  lat: number
  lng: number
  coverageRadiusKm: number
  minimumOrder: number
  categories: string[]
  status: 'active' | 'paused' | 'review'
  // Extra fields kept from existing mock shape
  razonSocial?: string
  cuit?: string
  deliveryTimeLabel?: string
  deliveryTimeHours?: number
  deliveryZones?: string[]
  deliveryHours?: string
  createdAt: unknown
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDistribuidora(doc: FirestoreDistributor & { id: string }): Distribuidora {
  return {
    id: doc.id,
    email: '',           // populated from users collection in a real auth flow
    role: 'distribuidora',
    companyName: doc.companyName,
    razonSocial: doc.razonSocial ?? '',
    cuit: doc.cuit ?? '',
    phone: doc.phone,
    address: doc.address,
    coverageRadiusKm: doc.coverageRadiusKm,
    minOrder: doc.minimumOrder,
    deliveryTimeLabel: doc.deliveryTimeLabel ?? '',
    deliveryTimeHours: doc.deliveryTimeHours ?? 24,
    deliveryZones: doc.deliveryZones ?? [],
    deliveryHours: doc.deliveryHours ?? '',
    location: { lat: doc.lat, lng: doc.lng, city: doc.city },
    createdAt: '',
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Returns all active distributors. Falls back to mock data. */
export async function getDistributors(): Promise<Distribuidora[]> {
  try {
    const docs = await getDocumentsByField<FirestoreDistributor>(
      COLLECTIONS.distributors,
      'status',
      '==',
      'active'
    )
    if (docs.length > 0) return docs.map(toDistribuidora)
  } catch {
    // fall through
  }
  return mockDistribuidoras
}

/** Returns a distributor by ID. Falls back to mock data. */
export async function getDistributorById(id: string): Promise<Distribuidora | null> {
  try {
    const doc = await getDocument<FirestoreDistributor>(COLLECTIONS.distributors, id)
    if (doc) return toDistribuidora(doc)
  } catch {
    // fall through
  }
  return mockDistribuidoras.find(d => d.id === id) ?? null
}

/**
 * Returns DistributorCards for the comercio home, optionally filtered by
 * the commerce's location (coverage check) and sorted by distance.
 */
export async function getDistributorCards(
  commerceLocation?: LatLng
): Promise<DistributorCard[]> {
  try {
    const docs = await getDocumentsByField<FirestoreDistributor>(
      COLLECTIONS.distributors,
      'status',
      '==',
      'active'
    )
    if (docs.length > 0) {
      return docs
        .filter(d =>
          commerceLocation
            ? isWithinCoverage(commerceLocation, { lat: d.lat, lng: d.lng }, d.coverageRadiusKm)
            : true
        )
        .map(d => {
          const distKm = commerceLocation
            ? getDistanceKm(commerceLocation, { lat: d.lat, lng: d.lng })
            : null
          return {
            id: d.id,
            companyName: d.companyName,
            initials: d.companyName
              .split(' ')
              .slice(0, 2)
              .map(w => w[0])
              .join('')
              .toUpperCase(),
            distance: distKm !== null ? formatDistance(distKm) : '—',
            deliveryInfo: d.deliveryTimeLabel ?? '',
            minOrder: d.minimumOrder,
            productCount: 0,  // TODO: derive from products subcollection count
            categories: d.categories ?? [],
          }
        })
        .sort((a, b) =>
          parseFloat(a.distance) - parseFloat(b.distance)
        )
    }
  } catch {
    // fall through
  }

  // Mock fallback — apply optional coverage filter using mock location data
  if (commerceLocation) {
    return mockDistribuidoras
      .filter(d =>
        isWithinCoverage(
          commerceLocation,
          { lat: d.location.lat, lng: d.location.lng },
          d.coverageRadiusKm
        )
      )
      .map(d => {
        const distKm = getDistanceKm(commerceLocation, {
          lat: d.location.lat,
          lng: d.location.lng,
        })
        const card = mockDistributorCards.find(c => c.id === d.id)
        return {
          id: d.id,
          companyName: d.companyName,
          initials: card?.initials ?? d.companyName.slice(0, 2).toUpperCase(),
          distance: formatDistance(distKm),
          deliveryInfo: d.deliveryTimeLabel,
          minOrder: d.minOrder,
          productCount: card?.productCount ?? 0,
          categories: card?.categories ?? [],
        }
      })
  }

  return mockDistributorCards
}

/**
 * Create or update a distributor profile.
 * The document ID should match the Firebase Auth UID of the owning user.
 */
export async function upsertDistributor(
  id: string,
  data: Omit<FirestoreDistributor, 'createdAt'>
): Promise<void> {
  await setDocument(COLLECTIONS.distributors, id, data)
}

/**
 * Update distributor status. Only call this from a server action or admin panel.
 * TODO: add Firestore security rules to restrict to admin/owner role.
 */
export async function updateDistributorStatus(
  id: string,
  status: 'active' | 'paused' | 'review'
): Promise<void> {
  await updateDocument(COLLECTIONS.distributors, id, { status })
}
