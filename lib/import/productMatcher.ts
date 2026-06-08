/**
 * Product matcher — finds masterProduct candidates for imported product rows.
 *
 * Matching levels:
 *   strong  — exact normalizedName match → auto-assign image, no review needed
 *   medium  — alias match                → auto-assign, flag for review
 *   weak    — partial contains match     → suggest only, require human approval
 *   none    — no match                   → use category fallback image
 */

import type { MasterProduct, Product } from '@/lib/types'
import type { ParsedProductRow } from '@/lib/import/productsImport'
import { getCategoryFallbackImage } from '@/lib/data/categoryFallbacks'
import { getMasterProducts } from '@/lib/data/masterProducts.service'

// ─── Normalization ─────────────────────────────────────────────────────────────

/**
 * Canonical normalization for product name matching.
 * Must mirror the Python normalize_product_name() in scripts/foodi/filter_foodi_ar.py.
 *
 * Rules:
 * - lowercase, no accents (NFD)
 * - decimal comma/dot stripped: 2,25 → 225 / 2.25 → 225
 * - unit normalization: "1 litro" → "1l", "500 ml" → "500ml", "1 kg" → "1kg"
 * - collapse whitespace, strip non-alphanumeric (keep dash)
 */
export function normalizeProductName(name: string): string {
  if (!name) return ''

  let s = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents

  // Strip decimal separators from numbers: 2,25 → 225, 2.25 → 225
  s = s.replace(/(\d+)[,.](\d+)/g, (_, a, b) => a + b)

  // Unit normalization
  s = s.replace(/(\d+)\s*litros?\b/g, '$1l')
  s = s.replace(/(\d+)\s*lts?\b/g, '$1l')
  s = s.replace(/(\d+)\s+l\b/g, '$1l')       // space guard → avoid "el"
  s = s.replace(/(\d+)\s*mililitros?\b/g, '$1ml')
  s = s.replace(/(\d+)\s+ml\b/g, '$1ml')
  s = s.replace(/(\d+)ml\b/g, '$1ml')
  s = s.replace(/(\d+)\s*kilogr?amos?\b/g, '$1kg')
  s = s.replace(/(\d+)\s*kilos?\b/g, '$1kg')
  s = s.replace(/(\d+)\s+kg\b/g, '$1kg')
  s = s.replace(/(\d+)\s*gramos?\b/g, '$1g')
  s = s.replace(/(\d+)\s*grs?\b/g, '$1g')
  s = s.replace(/(\d+)\s+g\b/g, '$1g')

  // Remove special chars (keep alphanum, space, dash)
  s = s.replace(/[^\w\s\-]/g, ' ')

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim()

  return s
}

// ─── Match types ───────────────────────────────────────────────────────────────

export type MatchConfidence = 'strong' | 'medium' | 'weak'

export interface MatchResult {
  masterProduct: MasterProduct
  confidence: MatchConfidence
}

// ─── matchProduct ──────────────────────────────────────────────────────────────

/**
 * Try to find a masterProduct for a given product name (+ optional brand).
 * Expects the allMasterProducts array to be preloaded (call getMasterProducts() once).
 */
export function matchProduct(
  inputName: string,
  allMasterProducts: MasterProduct[],
  inputBrand?: string,
): MatchResult | null {
  const inputNorm = normalizeProductName(inputName)
  if (!inputNorm || inputNorm.length < 3) return null

  const brandNorm = inputBrand
    ? inputBrand.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    : ''

  let bestResult: MatchResult | null = null

  for (const mp of allMasterProducts) {
    if (mp.status === 'disabled') continue

    let confidence: MatchConfidence | null = null

    // 1. Exact normalizedName match → strong
    if (mp.normalizedName === inputNorm) {
      confidence = 'strong'
    }
    // 2. Alias exact match → medium
    else if (mp.aliases.includes(inputNorm)) {
      confidence = 'medium'
    }
    // 3. Partial contains (longer than 4 chars to avoid false positives) → weak
    else if (
      inputNorm.length > 4 &&
      (mp.normalizedName.includes(inputNorm) || inputNorm.includes(mp.normalizedName))
    ) {
      confidence = 'weak'
    }

    if (!confidence) continue

    // Brand boost: if brands match, upgrade confidence one level
    if (brandNorm && mp.brand) {
      const mpBrandNorm = mp.brand.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
      if (mpBrandNorm === brandNorm || mpBrandNorm.includes(brandNorm) || brandNorm.includes(mpBrandNorm)) {
        if (confidence === 'medium') confidence = 'strong'
        else if (confidence === 'weak')   confidence = 'medium'
      }
    }

    // Keep best result (strong > medium > weak)
    if (!bestResult || confidenceRank(confidence) > confidenceRank(bestResult.confidence)) {
      bestResult = { masterProduct: mp, confidence }
    }

    // Short-circuit on strong match
    if (bestResult.confidence === 'strong') break
  }

  return bestResult
}

function confidenceRank(c: MatchConfidence): number {
  return c === 'strong' ? 3 : c === 'medium' ? 2 : 1
}

// ─── matchBulk ────────────────────────────────────────────────────────────────

export interface EnrichedParsedRow extends ParsedProductRow {
  masterProductId?: string
  imageUrl?: string
  imageSource?: 'master' | 'category_fallback' | 'none'
  matchConfidence?: MatchConfidence
}

/**
 * Enrich an array of parsed product rows with master catalog data.
 * Loads masterProducts from Firestore (cached) and matches each row.
 *
 * - strong/medium match → imageSource: 'master', imageUrl from masterProduct
 * - weak match          → imageSource: 'master' (provisional), flagged for review
 * - no match            → imageSource: 'category_fallback', imageUrl = SVG fallback
 */
export async function matchBulk(
  rows: ParsedProductRow[],
): Promise<EnrichedParsedRow[]> {
  let allMasterProducts: MasterProduct[] = []
  try {
    allMasterProducts = await getMasterProducts()
  } catch (err) {
    console.error('[productMatcher] failed to load masterProducts, skipping match', err)
    // Return rows unchanged (best effort — don't break import on match failure)
    return rows as EnrichedParsedRow[]
  }

  if (allMasterProducts.length === 0) {
    // No catalog yet — assign category fallbacks
    return rows.map(row => ({
      ...row,
      imageSource: 'category_fallback',
      imageUrl: getCategoryFallbackImage(row.categoria),
    }))
  }

  return rows.map(row => {
    const result = matchProduct(row.nombre, allMasterProducts, row.marca || undefined)

    if (result && (result.confidence === 'strong' || result.confidence === 'medium')) {
      return {
        ...row,
        masterProductId: result.masterProduct.id,
        imageUrl: result.masterProduct.imageUrl || getCategoryFallbackImage(row.categoria),
        imageSource: 'master' as const,
        matchConfidence: result.confidence,
      }
    }

    if (result && result.confidence === 'weak') {
      return {
        ...row,
        masterProductId: result.masterProduct.id,
        imageUrl: result.masterProduct.imageUrl || getCategoryFallbackImage(row.categoria),
        imageSource: 'master' as const,
        matchConfidence: result.confidence,
        // Flagged as weak: distributor sees a suggested match but can reject it
      }
    }

    return {
      ...row,
      imageSource: 'category_fallback' as const,
      imageUrl: getCategoryFallbackImage(row.categoria),
    }
  })
}

// ─── matchExistingProducts ────────────────────────────────────────────────────

export interface ExistingProductMatchResult {
  product: Product
  masterProduct: MasterProduct
  confidence: MatchConfidence
}

/**
 * Match already-stored products (without imageUrl) against the master catalog.
 * Used for backfilling images on products created before the catalog existed.
 *
 * Only returns products that have a match AND where the matched master has an imageUrl.
 * Loads masterProducts from Firestore (cached).
 */
export async function matchExistingProducts(
  products: Product[],
): Promise<ExistingProductMatchResult[]> {
  let allMasterProducts: MasterProduct[] = []
  try {
    allMasterProducts = await getMasterProducts()
  } catch (err) {
    console.error('[productMatcher] matchExistingProducts: failed to load masterProducts', err)
    return []
  }

  if (allMasterProducts.length === 0) return []

  const results: ExistingProductMatchResult[] = []
  for (const product of products) {
    const result = matchProduct(product.name, allMasterProducts, product.brand)
    // Only include when the matched master actually has an image to provide
    if (result && result.masterProduct.imageUrl) {
      results.push({ product, masterProduct: result.masterProduct, confidence: result.confidence })
    }
  }
  return results
}
