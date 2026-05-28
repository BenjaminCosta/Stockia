import { ARGENTINA_PROVINCES } from './argentina'
import {
  buildLocationKey,
  normalizeTextSlug,
} from '@/lib/firebase/geo'

export interface NormalizedLocation {
  province: string
  provinceSlug: string
  city: string
  citySlug: string
  locationKey: string
  lat: null
  lng: null
}

export function findProvinceByNameOrSlug(value: string) {
  const slug = normalizeTextSlug(value)
  return ARGENTINA_PROVINCES.find(
    province => province.slug === slug || normalizeTextSlug(province.name) === slug
  )
}

export function findLocality(provinceNameOrSlug: string, localityNameOrSlug: string) {
  const province = findProvinceByNameOrSlug(provinceNameOrSlug)
  if (!province) return null

  const localitySlug = normalizeTextSlug(localityNameOrSlug)
  const locality = province.localities.find(item => normalizeTextSlug(item) === localitySlug)
  return locality ? { province, locality } : null
}

export function getLocalitiesForProvince(provinceNameOrSlug: string): string[] {
  return findProvinceByNameOrSlug(provinceNameOrSlug)?.localities ?? []
}

export function normalizeLocationInput(input: {
  province: string
  city: string
}): NormalizedLocation {
  const province = findProvinceByNameOrSlug(input.province)
  const locality = province
    ? findLocality(province.slug, input.city)?.locality
    : null

  const provinceName = province?.name ?? input.province.trim()
  const cityName = locality ?? input.city.trim()
  const provinceSlug = province?.slug ?? normalizeTextSlug(provinceName)
  const citySlug = normalizeTextSlug(cityName)
  const locationKey = buildLocationKey(provinceSlug, citySlug)

  return {
    province: provinceName,
    provinceSlug,
    city: cityName,
    citySlug,
    locationKey,
    lat: null,
    lng: null,
  }
}

export function isValidProvince(value: string): boolean {
  return !!findProvinceByNameOrSlug(value)
}

export function isValidLocality(provinceNameOrSlug: string, localityNameOrSlug: string): boolean {
  return !!findLocality(provinceNameOrSlug, localityNameOrSlug)
}
