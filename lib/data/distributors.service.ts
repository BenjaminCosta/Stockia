import { getCollection, getDocument, getDocumentsByField, updateDocument, setDocument } from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'
import { mockDistribuidoras, mockDistributorCards } from '../mock-data'
import { getDistanceKm, formatDistance, isWithinCoverage, normalizeCitySlug, normalizeTextSlug, buildLocationKey, hasRealCoordinates } from '../firebase/geo'
import { normalizeLocationInput } from '../locations/location-utils'
import type { Distribuidora, DistributorCard, CommerceContext } from '../types'

// ─── Internal helper: aggregate ratings per distributor ────────────────────────

async function fetchRatingsByDistributor(): Promise<Record<string, { avg: number; count: number }>> {
  try {
    const reviews = await getCollection<{ distributorId: string; ratingGeneral: number; status: string }>(COLLECTIONS.reviews)
    const map: Record<string, { sum: number; count: number }> = {}
    for (const r of reviews) {
      if (r.status !== 'visible') continue
      if (!r.distributorId) continue
      if (!map[r.distributorId]) map[r.distributorId] = { sum: 0, count: 0 }
      map[r.distributorId].sum += Number(r.ratingGeneral) || 0
      map[r.distributorId].count++
    }
    return Object.fromEntries(
      Object.entries(map).map(([id, { sum, count }]) => [
        id,
        { avg: Math.round((sum / count) * 10) / 10, count },
      ])
    )
  } catch {
    return {}
  }
}

// ─── Firestore shape ──────────────────────────────────────────────────────────

export interface FirestoreDistributor {
  userId: string
  companyName: string
  logoUrl?: string
  phone: string
  address: string
  city: string
  province: string
  provinceSlug?: string
  citySlug?: string
  locationKey?: string
  /** Legacy key name from previous implementation. Prefer locationKey. */
  zoneKey?: string
  /** Real WGS-84 coords. Omitted when not yet geocoded. */
  lat?: number | null
  lng?: number | null
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
  deliveryLocationKeys?: string[]
  /** Legacy key name from previous implementation. Prefer deliveryLocationKeys. */
  deliveryZoneKeys?: string[]
  deliveryHours?: string
  location?: {
    province?: string
    provinceSlug?: string
    city?: string
    citySlug?: string
    locationKey?: string
    zoneKey?: string
    lat?: number | null
    lng?: number | null
  }
  createdAt: unknown
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDistribuidora(doc: FirestoreDistributor & { id: string }): Distribuidora {
  const normalizedLocation = normalizeLocationInput({
    province: doc.location?.province || doc.province || 'Buenos Aires',
    city: doc.location?.city || doc.city || '',
  })
  const lat = doc.location?.lat ?? doc.lat ?? null
  const lng = doc.location?.lng ?? doc.lng ?? null

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
    deliveryLocationKeys: doc.deliveryLocationKeys ?? doc.deliveryZoneKeys ?? [],
    deliveryZoneKeys: doc.deliveryZoneKeys ?? [],
    deliveryHours: doc.deliveryHours ?? '',
    location: {
      ...normalizedLocation,
      provinceSlug: doc.location?.provinceSlug || doc.provinceSlug || normalizedLocation.provinceSlug,
      citySlug: doc.location?.citySlug || doc.citySlug || normalizedLocation.citySlug,
      locationKey: doc.location?.locationKey || doc.location?.zoneKey || doc.locationKey || doc.zoneKey || normalizedLocation.locationKey,
      lat: hasRealCoordinates(lat, lng) ? lat : null,
      lng: hasRealCoordinates(lat, lng) ? lng : null,
    },
    createdAt: '',
  }
}

// ─── Zone-matching strategy ───────────────────────────────────────────────────
//
// Priority order:
//   1. Real coords on both sides → Haversine + coverageRadiusKm
//   2. commerceContext.locationKey present → deliveryLocationKeys match
//   3. Legacy commerceContext.citySlug present → legacy delivery list slug match
//   4. No context → show all distributors
//
// "Real coords" means lat !== 0 && lng !== 0 && both are defined.
// Lat 0 / Lng 0 maps to Null Island (Gulf of Guinea) — always invalid for ARG.

function getDistributorLocationKey(d: FirestoreDistributor & { id: string }): string {
  const provinceSlug = d.location?.provinceSlug || d.provinceSlug || normalizeTextSlug(d.location?.province || d.province || 'Buenos Aires')
  const citySlug = d.location?.citySlug || d.citySlug || normalizeCitySlug(d.location?.city || d.city || '')
  return d.location?.locationKey || d.location?.zoneKey || d.locationKey || d.zoneKey || buildLocationKey(provinceSlug, citySlug)
}

function getDistributorDeliveryLocationKeys(d: FirestoreDistributor & { id: string }): string[] {
  if (d.deliveryLocationKeys?.length) return d.deliveryLocationKeys
  if (d.deliveryZoneKeys?.length) return d.deliveryZoneKeys

  const provinceSlug = d.location?.provinceSlug || d.provinceSlug || normalizeTextSlug(d.location?.province || d.province || 'Buenos Aires')
  const legacyLocations = d.deliveryZones ?? []
  return legacyLocations.map(location => {
    const slug = normalizeCitySlug(location)
    return location.includes(':') ? location : buildLocationKey(provinceSlug, slug)
  })
}

function matchesContextFn(context: CommerceContext | undefined) {
  const commerceCoordsOk = hasRealCoordinates(context?.lat, context?.lng)
  const commerceLocationKey = context?.locationKey || context?.zoneKey
  const hasLocationKey = !!commerceLocationKey
  const hasCitySlug = !!(context?.citySlug)

  return (d: FirestoreDistributor & { id: string }): boolean => {
    const distLat = d.location?.lat ?? d.lat ?? null
    const distLng = d.location?.lng ?? d.lng ?? null
    if (commerceCoordsOk && hasRealCoordinates(distLat, distLng)) {
      // Haversine: commerce must be within the distributor's coverage radius
      return isWithinCoverage(
        { lat: context!.lat!, lng: context!.lng! },
        { lat: distLat!, lng: distLng! },
        d.coverageRadiusKm
      )
    }
    if (hasLocationKey) {
      return getDistributorDeliveryLocationKeys(d).includes(commerceLocationKey!)
    }
    if (hasCitySlug) {
      // Legacy locality matching: distributor must deliver to commerce's city.
      return (d.deliveryZones ?? []).some(
        z => normalizeCitySlug(z) === context!.citySlug
      ) || getDistributorLocationKey(d).endsWith(`:${context!.citySlug}`)
    }
    return true // no context → show all
  }
}

function computeDistanceFn(context: CommerceContext | undefined) {
  const commerceCoordsOk = hasRealCoordinates(context?.lat, context?.lng)
  const hasLocationContext = !!(context?.locationKey || context?.zoneKey || context?.citySlug)

  return (d: FirestoreDistributor & { id: string }): string => {
    const distLat = d.location?.lat ?? d.lat ?? null
    const distLng = d.location?.lng ?? d.lng ?? null
    if (commerceCoordsOk && hasRealCoordinates(distLat, distLng)) {
      const km = getDistanceKm(
        { lat: context!.lat!, lng: context!.lng! },
        { lat: distLat!, lng: distLng! }
      )
      return formatDistance(km)
    }
    if (hasLocationContext) return 'Entrega en tu localidad'
    return '—'
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
 * Returns DistributorCards for the comercio home and distribuidoras list.
 *
 * Matching strategy (in priority order):
 *   1. context.lat + context.lng are non-zero → Haversine within coverageRadiusKm
 *   2. context.locationKey present → deliveryLocationKeys match
 *   3. context.citySlug present → legacy delivery list slug-match
 *   4. No context → return all active distributors
 *
 * The `distance` field on each card reflects the strategy used:
 *   - "3.2 km"   (real coords)
 *   - "Entrega en tu localidad" (zone match)
 *   - "—"          (no context)
 *
 * Falls back to mockDistributorCards when Firestore has no data.
 */
export async function getDistributorCards(
  context?: CommerceContext
): Promise<DistributorCard[]> {
  const matchesCtx = matchesContextFn(context)
  const computeDist = computeDistanceFn(context)
  const coordsOk = hasRealCoordinates(context?.lat, context?.lng)

  try {
    const [docs, ratings] = await Promise.all([
      getDocumentsByField<FirestoreDistributor>(COLLECTIONS.distributors, 'status', '==', 'active'),
      fetchRatingsByDistributor(),
    ])

    if (docs.length > 0) {
      const cards: DistributorCard[] = docs
        .filter(matchesCtx)
        .map(d => {
          const r = ratings[d.id]
          return {
            id: d.id,
            companyName: d.companyName,
            initials: d.companyName
              .split(' ')
              .slice(0, 2)
              .map(w => w[0])
              .join('')
              .toUpperCase(),
            distance: computeDist(d),
            deliveryInfo: d.deliveryTimeLabel ?? '',
            minOrder: d.minimumOrder,
            productCount: 0,
            categories: d.categories ?? [],
            rating: r ? r.avg : undefined,
            reviewCount: r ? r.count : undefined,
          }
        })

      // Sort: by numeric km when we have coords, alphabetically otherwise
      return cards.sort((a, b) => {
        if (coordsOk) {
          const da = parseFloat(a.distance)
          const db = parseFloat(b.distance)
          if (!isNaN(da) && !isNaN(db)) return da - db
        }
        return a.companyName.localeCompare(b.companyName, 'es')
      })
    }
  } catch {
    // fall through to mock
  }

  // Mock fallback — apply coord filter when we have real coords;
  // for zone-matching or no context, return all mock cards (demo-friendly).
  if (coordsOk) {
    return mockDistribuidoras
      .filter(d =>
        isWithinCoverage(
          { lat: context!.lat!, lng: context!.lng! },
          { lat: d.location.lat ?? 0, lng: d.location.lng ?? 0 },
          d.coverageRadiusKm
        )
      )
      .map(d => {
        const distKm = getDistanceKm(
          { lat: context!.lat!, lng: context!.lng! },
          { lat: d.location.lat ?? 0, lng: d.location.lng ?? 0 }
        )
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
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
  }

  // Zone-match or no context → return all mock cards
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
