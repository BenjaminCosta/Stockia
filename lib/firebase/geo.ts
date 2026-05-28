// Geolocation utilities for Stockia
// Used to filter distributors by coverage radius relative to a commerce location.

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Calculate the great-circle distance between two coordinates using the
 * Haversine formula. Returns distance in kilometers.
 */
export function getDistanceKm(a: LatLng, b: LatLng): number {
  const R = 6371 // Earth radius in km
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng
  return R * 2 * Math.asin(Math.sqrt(h))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Format a raw distance in km to a human-readable string.
 * < 1 km → "850 m", >= 1 km → "3.2 km"
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export function hasRealCoordinates(lat?: number | null, lng?: number | null): lat is number {
  return typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat !== 0 &&
    lng !== 0
}

/**
 * Return true if the distributor's coverage radius reaches the commerce location.
 */
export function isWithinCoverage(
  commerceLocation: LatLng,
  distributorLocation: LatLng,
  coverageRadiusKm: number
): boolean {
  return getDistanceKm(commerceLocation, distributorLocation) <= coverageRadiusKm
}

/**
 * Normalize a city name to a URL-safe slug for reliable locality matching.
 * Removes accents, lowercases, replaces spaces and special chars with hyphens.
 *
 * Examples:
 *   "Lomas de Zamora" → "lomas-de-zamora"
 *   "Avellaneda"      → "avellaneda"
 *   "Quilmes"         → "quilmes"
 */
export function normalizeTextSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accent combining chars
    .replace(/[^a-z0-9]+/g, '-')     // non-alphanumeric runs → dash
    .replace(/^-|-$/g, '')           // trim leading/trailing dashes
}

export function normalizeCitySlug(city: string): string {
  return normalizeTextSlug(city)
}

export function buildLocationKey(provinceSlug: string, citySlug: string): string {
  return [provinceSlug, citySlug].filter(Boolean).join(':')
}
