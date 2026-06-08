// Maps category IDs and common category names → fallback image path.
// Images live in public/products/fallbacks/ (512×512 WebP/SVG).
// Used when a product has no imageUrl of its own.

const CATEGORY_FALLBACKS: Record<string, string> = {
  // by id (from FooDI-ML & masterProducts)
  bebidas:    '/products/fallbacks/bebidas.svg',
  almacen:    '/products/fallbacks/almacen.svg',
  lacteos:    '/products/fallbacks/lacteos.svg',
  limpieza:   '/products/fallbacks/limpieza.svg',
  snacks:     '/products/fallbacks/snacks.svg',
  perfumeria: '/products/fallbacks/perfumeria.svg',
  mascotas:   '/products/fallbacks/mascotas.svg',
  panaderia:  '/products/fallbacks/panaderia.svg',
  fiambres:   '/products/fallbacks/fiambres.svg',
  congelados: '/products/fallbacks/congelados.svg',
  golosinas:  '/products/fallbacks/golosinas.svg',
  otros:      '/products/fallbacks/otros.svg',
}

// Alias map: category display name → category id key
const NAME_TO_ID: Record<string, string> = {
  'bebidas':           'bebidas',
  'almacén':           'almacen',
  'almacen':           'almacen',
  'lácteos':           'lacteos',
  'lacteos':           'lacteos',
  'limpieza':          'limpieza',
  'snacks':            'snacks',
  'perfumería':        'perfumeria',
  'perfumeria':        'perfumeria',
  'mascotas':          'mascotas',
  'panadería':         'panaderia',
  'panaderia':         'panaderia',
  'fiambres':          'fiambres',
  'congelados':        'congelados',
  'golosinas y kiosco':'golosinas',
  'golosinas':         'golosinas',
  'otros':             'otros',
}

/**
 * Returns the public fallback image path for a given category.
 * Accepts both category IDs ("bebidas") and display names ("Bebidas", "Lácteos").
 */
export function getCategoryFallbackImage(category: string): string {
  const key = (category ?? '').toLowerCase().trim()
  const id = NAME_TO_ID[key] ?? key
  return CATEGORY_FALLBACKS[id] ?? CATEGORY_FALLBACKS.otros
}
