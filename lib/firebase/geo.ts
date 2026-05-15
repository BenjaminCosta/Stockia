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
