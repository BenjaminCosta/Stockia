'use client'

import { useEffect, useRef, useState, useCallback, useMemo, type ReactNode } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Package, ChevronRight, X, Store, MapPin, Star, SlidersHorizontal } from 'lucide-react'
import { SearchInput } from '@/components/ui/SearchInput'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { formatCurrency } from '@/lib/mock-data'
import { useApp } from '@/lib/app-context'
import { useProducts, useDistributors, useCategories } from '@/hooks/use-data'
import { getDistributorById } from '@/lib/data/distributors.service'
import { Comercio, DistributorCard, Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/components/product-card'
import { ProductCardSkeleton } from '@/components/ui/SkeletonCard'

type SortKey = 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc' | 'min_order_asc' | 'stock_desc'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'relevance', label: 'Más relevantes' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'rating_desc', label: 'Mejor calificación' },
  { value: 'min_order_asc', label: 'Menor pedido mínimo' },
  { value: 'stock_desc', label: 'Más stock' },
]

const MIN_ORDER_FILTERS = [
  { value: '50000', label: 'Hasta $50.000' },
  { value: '100000', label: 'Hasta $100.000' },
  { value: '200000', label: 'Hasta $200.000' },
]

function parseNumberParam(value: string | null) {
  if (!value) return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function isSortKey(value: string | null): value is SortKey {
  return SORT_OPTIONS.some(option => option.value === value)
}

interface CatalogFilterState {
  minPrice: string
  maxPrice: string
  distributor: string
  brand: string
  stockOnly: boolean
  offerOnly: boolean
  minOrder: string
}

interface CatalogFiltersProps {
  filters: CatalogFilterState
  distributors: DistributorCard[]
  brands: string[]
  onFilterChange: (key: keyof CatalogFilterState, value: string | boolean) => void
  onClear: () => void
}

function FilterGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <details
      className="group border-t border-[#DFE1E8]/70 py-3 first:border-t-0"
      open={open}
      onToggle={event => setOpen((event.currentTarget as HTMLDetailsElement).open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-widest text-[#5F6880] transition-colors hover:text-[#0B1A45] [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-open:rotate-90" />
      </summary>
      <div className="pt-3">
        {children}
      </div>
    </details>
  )
}

function CatalogFilters({ filters, distributors, brands, onFilterChange, onClear }: CatalogFiltersProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-heading text-sm font-bold text-[#0B1A45]">Filtros</h2>
        <button
          onClick={onClear}
          className="text-[11px] font-bold text-[#7A839C] transition-colors hover:text-[#0B1A45]"
        >
          Limpiar
        </button>
      </div>

      <FilterGroup title="Precio" defaultOpen={!!(filters.minPrice || filters.maxPrice)}>
        <div className="grid grid-cols-2 gap-2">
          <input
            inputMode="numeric"
            value={filters.minPrice}
            onChange={event => onFilterChange('minPrice', event.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Mín."
            className="h-8 rounded-lg border border-[#DFE1E8] bg-white px-2.5 text-xs font-semibold text-[#0B1A45] outline-none transition focus:border-[#0B1A45]/35 focus:ring-2 focus:ring-[#0B1A45]/10"
          />
          <input
            inputMode="numeric"
            value={filters.maxPrice}
            onChange={event => onFilterChange('maxPrice', event.target.value.replace(/[^0-9]/g, ''))}
            placeholder="Máx."
            className="h-8 rounded-lg border border-[#DFE1E8] bg-white px-2.5 text-xs font-semibold text-[#0B1A45] outline-none transition focus:border-[#0B1A45]/35 focus:ring-2 focus:ring-[#0B1A45]/10"
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Distribuidora" defaultOpen={!!filters.distributor}>
        <Select value={filters.distributor || 'all'} onValueChange={value => onFilterChange('distributor', value === 'all' ? '' : value)}>
          <SelectTrigger className="h-8 w-full rounded-lg border-[#DFE1E8] bg-white text-xs font-semibold text-[#0B1A45]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {distributors.map(distributor => (
              <SelectItem key={distributor.id} value={distributor.id}>
                {distributor.companyName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      {brands.length > 0 && (
        <FilterGroup title="Marca" defaultOpen={!!filters.brand}>
          <Select value={filters.brand || 'all'} onValueChange={value => onFilterChange('brand', value === 'all' ? '' : value)}>
            <SelectTrigger className="h-8 w-full rounded-lg border-[#DFE1E8] bg-white text-xs font-semibold text-[#0B1A45]">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterGroup>
      )}

      <FilterGroup title="Pedido mínimo" defaultOpen={!!filters.minOrder}>
        <Select value={filters.minOrder || 'all'} onValueChange={value => onFilterChange('minOrder', value === 'all' ? '' : value)}>
          <SelectTrigger className="h-8 w-full rounded-lg border-[#DFE1E8] bg-white text-xs font-semibold text-[#0B1A45]">
            <SelectValue placeholder="Cualquier mínimo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier mínimo</SelectItem>
            {MIN_ORDER_FILTERS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>

      <FilterGroup title="Disponibilidad" defaultOpen={filters.stockOnly || filters.offerOnly}>
        <div className="space-y-2">
        <label className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-xs font-semibold text-[#0B1A45]">
          <Checkbox
            checked={filters.stockOnly}
            onCheckedChange={checked => onFilterChange('stockOnly', checked === true)}
          />
          Solo con stock
        </label>
        <label className="flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-xs font-semibold text-[#0B1A45]">
          <Checkbox
            checked={filters.offerOnly}
            onCheckedChange={checked => onFilterChange('offerOnly', checked === true)}
          />
          Solo ofertas
        </label>
        </div>
      </FilterGroup>
    </div>
  )
}
// ── Page ──────────────────────────────────────────────────────────────────────

export default function BuscarPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedCategory = searchParams.get('categoria')
  const ofertaFilter = searchParams.get('oferta') === '1'
  const queryParam = searchParams.get('q') ?? ''
  const minPriceParam = searchParams.get('minPrice') ?? ''
  const maxPriceParam = searchParams.get('maxPrice') ?? ''
  const distributorParam = searchParams.get('distributor') ?? ''
  const brandParam = searchParams.get('brand') ?? ''
  const stockOnlyParam = searchParams.get('stock') === '1'
  const sortParam: SortKey = isSortKey(searchParams.get('sort')) ? searchParams.get('sort') as SortKey : 'relevance'
  const minOrderParam = searchParams.get('minOrder') ?? ''

  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [debouncedQuery, setDebouncedQuery] = useState(queryParam)
  const [quantities, setQuantities]   = useState<Record<string, number>>({})
  const [justAdded, setJustAdded]     = useState<Record<string, boolean>>({})
  const { addToCart, cart, currentUser } = useApp()
  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const loc = comercio?.location
  const commerceContext = loc
    ? { lat: loc.lat ?? undefined, lng: loc.lng ?? undefined, locationKey: loc.locationKey, citySlug: loc.citySlug }
    : undefined
  const { data: products, loading: isLoading } = useProducts()
  const { data: distributors } = useDistributors(commerceContext)
  const { data: allDistributors } = useDistributors()
  const { data: allCategories } = useCategories()

  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key)
      else next.set(key, value)
    })

    const qs = next.toString()
    router.replace(qs ? `/comercio/buscar?${qs}` : '/comercio/buscar')
  }, [router, searchParams])

  useEffect(() => {
    setSearchQuery(queryParam)
    setDebouncedQuery(queryParam)
  }, [queryParam])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    if (debouncedQuery.trim() === queryParam) return
    updateSearchParams({ q: debouncedQuery.trim() || null })
  }, [debouncedQuery, queryParam, updateSearchParams])

  const handleCategoryClick = (name: string | null) => {
    updateSearchParams({ categoria: name })
  }

  const distributorMap = useMemo(() => new Map(distributors.map(d => [d.id, d])), [distributors])
  const allDistributorMap = useMemo(() => new Map(allDistributors.map(d => [d.id, d])), [allDistributors])

  // Resolved names for distributors not found in either map (e.g. inactive or unsynced)
  const [resolvedDistributorNames, setResolvedDistributorNames] = useState<Record<string, string>>({})
  const fetchingIdsRef = useRef(new Set<string>())
  useEffect(() => {
    const missing = Array.from(new Set(products.map(p => p.distribuidoraId))).filter(
      id => !distributorMap.has(id) && !allDistributorMap.has(id) && !fetchingIdsRef.current.has(id)
    )
    if (missing.length === 0) return
    missing.forEach(id => fetchingIdsRef.current.add(id))
    Promise.all(missing.map(id => getDistributorById(id).then(d => [id, d?.companyName ?? ''] as const).catch(() => [id, ''] as const)))
      .then(entries => setResolvedDistributorNames(prev => Object.assign({ ...prev }, Object.fromEntries(entries))))
  }, [products, distributorMap, allDistributorMap])

  const catalogProducts = useMemo(() => products.filter((p: Product) => p.status !== 'paused'), [products])

  const normalizedQuery = debouncedQuery.trim()
  const normalizedSearch = normalizedQuery.toLowerCase()
  const minPrice = parseNumberParam(minPriceParam)
  const maxPrice = parseNumberParam(maxPriceParam)
  const minOrderLimit = parseNumberParam(minOrderParam)

  const filterState: CatalogFilterState = {
    minPrice: minPriceParam,
    maxPrice: maxPriceParam,
    distributor: distributorParam,
    brand: brandParam,
    stockOnly: stockOnlyParam,
    offerOnly: ofertaFilter,
    minOrder: minOrderParam,
  }

  const availableBrands = useMemo(() => {
    return Array.from(new Set(
      catalogProducts
        .map(product => product.brand?.trim())
        .filter((brand): brand is string => !!brand)
    )).sort((a, b) => a.localeCompare(b))
  }, [catalogProducts])

  const matchingDistributors = useMemo(() => {
    if (!normalizedSearch) return []
    return distributors.filter(distributor => {
      const distributorProducts = catalogProducts.filter(product => product.distribuidoraId === distributor.id)
      return (
        distributor.companyName.toLowerCase().includes(normalizedSearch) ||
        distributor.categories.some(category => category.toLowerCase().includes(normalizedSearch)) ||
        distributorProducts.some(product =>
          product.name.toLowerCase().includes(normalizedSearch) ||
          product.category.toLowerCase().includes(normalizedSearch) ||
          (product.brand?.toLowerCase().includes(normalizedSearch) ?? false) ||
          (product.sku?.toLowerCase().includes(normalizedSearch) ?? false)
        )
      )
    })
  }, [distributors, catalogProducts, normalizedSearch])

  const filteredProducts = useMemo(() => {
    const scored = catalogProducts
      .filter((p: Product) => {
        const q = normalizedSearch
        const distributor = distributorMap.get(p.distribuidoraId)
        const matchesSearch = !q ||
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.brand?.toLowerCase().includes(q) ?? false) ||
          (p.sku?.toLowerCase().includes(q) ?? false) ||
          (distributor?.companyName.toLowerCase().includes(q) ?? false)
        const matchesCategory = !selectedCategory || p.category === selectedCategory
        const matchesOffer = !ofertaFilter || p.isOffer === true
        const matchesStock = !stockOnlyParam || (p.status === 'active' && p.stock > 0)
        const matchesPriceMin = minPrice === null || p.price >= minPrice
        const matchesPriceMax = maxPrice === null || p.price <= maxPrice
        const matchesDistributor = !distributorParam || p.distribuidoraId === distributorParam
        const matchesBrand = !brandParam || p.brand === brandParam
        const matchesMinOrder = minOrderLimit === null || (distributor?.minOrder ?? Number.POSITIVE_INFINITY) <= minOrderLimit

        return matchesSearch &&
          matchesCategory &&
          matchesOffer &&
          matchesStock &&
          matchesPriceMin &&
          matchesPriceMax &&
          matchesDistributor &&
          matchesBrand &&
          matchesMinOrder
      })
      .map(product => {
        const distributor = distributorMap.get(product.distribuidoraId)
        const normalizedName = product.name.toLowerCase()
        const normalizedCategory = product.category.toLowerCase()
        const normalizedDistributor = distributor?.companyName.toLowerCase() ?? ''
        const relevance =
          (normalizedSearch && normalizedName.includes(normalizedSearch) ? 40 : 0) +
          (normalizedSearch && normalizedName.startsWith(normalizedSearch) ? 20 : 0) +
          (normalizedSearch && normalizedCategory.includes(normalizedSearch) ? 12 : 0) +
          (normalizedSearch && normalizedDistributor.includes(normalizedSearch) ? 8 : 0) +
          (product.isOffer ? 4 : 0) +
          (product.status === 'active' && product.stock > 0 ? 3 : 0) +
          (distributor?.rating ?? 0)

        return { product, distributor, relevance }
      })

    return scored
      .sort((a, b) => {
        if (sortParam === 'price_asc') return a.product.price - b.product.price
        if (sortParam === 'price_desc') return b.product.price - a.product.price
        if (sortParam === 'rating_desc') return (b.distributor?.rating ?? 0) - (a.distributor?.rating ?? 0)
        if (sortParam === 'min_order_asc') return (a.distributor?.minOrder ?? Number.POSITIVE_INFINITY) - (b.distributor?.minOrder ?? Number.POSITIVE_INFINITY)
        if (sortParam === 'stock_desc') return b.product.stock - a.product.stock
        return b.relevance - a.relevance || a.product.price - b.product.price
      })
      .map(item => item.product)
  }, [
    catalogProducts,
    normalizedSearch,
    distributorMap,
    selectedCategory,
    ofertaFilter,
    stockOnlyParam,
    minPrice,
    maxPrice,
    distributorParam,
    brandParam,
    minOrderLimit,
    sortParam,
  ])
  const pageTitle = normalizedQuery
    ? `Resultados para "${normalizedQuery}"`
    : ofertaFilter
      ? 'Ofertas'
      : selectedCategory
        ? `Productos de ${selectedCategory}`
        : 'Buscar productos'

  const getQty = (id: string) => quantities[id] ?? 1
  const setQty = (product: Product, v: number) => {
    setQuantities(prev => ({ ...prev, [product.id]: Math.min(Math.max(1, v), Math.max(1, product.stock)) }))
  }

  const handleFilterChange = useCallback((key: keyof CatalogFilterState, value: string | boolean) => {
    if (key === 'offerOnly') {
      updateSearchParams({ oferta: value ? '1' : null })
      return
    }
    if (key === 'stockOnly') {
      updateSearchParams({ stock: value ? '1' : null })
      return
    }

    const paramKey = key === 'minOrder' ? 'minOrder' : key
    updateSearchParams({ [paramKey]: typeof value === 'string' && value ? value : null })
  }, [updateSearchParams])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setDebouncedQuery('')
    router.replace('/comercio/buscar')
  }, [router])

  const activeFilterChips = useMemo(() => {
    const distributor = distributors.find(d => d.id === distributorParam)
    const chips: { key: string; label: string; clear: () => void }[] = []

    if (selectedCategory) chips.push({ key: 'categoria', label: selectedCategory, clear: () => updateSearchParams({ categoria: null }) })
    if (normalizedQuery) chips.push({ key: 'q', label: `"${normalizedQuery}"`, clear: () => { setSearchQuery(''); setDebouncedQuery(''); updateSearchParams({ q: null }) } })
    if (minPriceParam) chips.push({ key: 'minPrice', label: `Desde ${formatCurrency(Number(minPriceParam))}`, clear: () => updateSearchParams({ minPrice: null }) })
    if (maxPriceParam) chips.push({ key: 'maxPrice', label: `Hasta ${formatCurrency(Number(maxPriceParam))}`, clear: () => updateSearchParams({ maxPrice: null }) })
    if (distributor) chips.push({ key: 'distributor', label: distributor.companyName, clear: () => updateSearchParams({ distributor: null }) })
    if (brandParam) chips.push({ key: 'brand', label: brandParam, clear: () => updateSearchParams({ brand: null }) })
    if (stockOnlyParam) chips.push({ key: 'stock', label: 'Con stock', clear: () => updateSearchParams({ stock: null }) })
    if (ofertaFilter) chips.push({ key: 'oferta', label: 'Ofertas', clear: () => updateSearchParams({ oferta: null }) })
    if (minOrderParam) chips.push({ key: 'minOrder', label: `Mín. ${formatCurrency(Number(minOrderParam))}`, clear: () => updateSearchParams({ minOrder: null }) })

    return chips
  }, [
    selectedCategory,
    normalizedQuery,
    minPriceParam,
    maxPriceParam,
    distributors,
    distributorParam,
    brandParam,
    stockOnlyParam,
    ofertaFilter,
    minOrderParam,
    updateSearchParams,
  ])

  const handleAdd = useCallback((product: Product) => {
    const dist = distributorMap.get(product.distribuidoraId) ?? allDistributorMap.get(product.distribuidoraId)
    const distribuidoraName = dist?.companyName ?? resolvedDistributorNames[product.distribuidoraId] ?? ''
    const qty = Math.min(quantities[product.id] ?? 1, Math.max(1, product.stock))
    const added = addToCart(product, distribuidoraName, qty)
    if (!added) return
    setJustAdded(prev => ({ ...prev, [product.id]: true }))
    setTimeout(() => setJustAdded(prev => ({ ...prev, [product.id]: false })), 2000)
  }, [addToCart, quantities, distributorMap, allDistributorMap, resolvedDistributorNames])

  const hasCartItems = !!(cart && cart.items.length > 0)

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F8FA]">

      {/* Sticky sub-header */}
      <div className="sticky top-12 z-30 bg-white border-b border-[#DFE1E8] shadow-[0_1px_4px_rgba(11,26,69,0.05)] lg:hidden">
        <div className="max-w-350 mx-auto px-3 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <SearchInput
              placeholder="Buscar productos, marcas o categorías..."
              value={searchQuery}
              onChange={setSearchQuery}
              className="flex-1 max-w-xl"
            />
          </div>

          {/* Category pills — all visible categories */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide -mx-3 px-3 md:mx-0 md:px-0">
            <button
              onClick={() => handleCategoryClick(null)}
              className={cn(
                'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border',
                selectedCategory === null
                  ? 'bg-[#0B1A45] text-white border-[#0B1A45]'
                  : 'bg-white text-[#7A839C] border-[#DFE1E8] hover:border-[#0B1A45]/30',
              )}
            >
              Todos
            </button>
            {allCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.name)}
                className={cn(
                  'shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border',
                  selectedCategory === cat.name
                    ? 'bg-[#0B1A45] text-white border-[#0B1A45]'
                    : 'bg-white text-[#7A839C] border-[#DFE1E8] hover:border-[#0B1A45]/30',
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className={cn('flex-1 max-w-350 mx-auto px-2.5 py-4 w-full md:px-8 md:py-5', hasCartItems && 'lg:pb-28')}>
        <header className="mb-4 md:mb-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {selectedCategory ? 'Categoría' : 'Catálogo'}
              </p>
              <h1 className="mt-0.5 font-heading text-xl font-bold tracking-tight text-foreground md:text-3xl">
                {pageTitle}
              </h1>
              <div className="mt-2 hidden items-center gap-2 lg:flex">
                <span className="text-sm font-medium text-[#7A839C]">
                  {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                </span>
                {activeFilterChips.slice(0, 3).map(chip => (
                  <button
                    key={chip.key}
                    onClick={chip.clear}
                    className="inline-flex h-7 items-center gap-1 rounded-full border border-[#DFE1E8] bg-white px-2.5 text-xs font-bold text-[#0B1A45] shadow-[0_1px_2px_rgba(11,26,69,0.04)] transition-colors hover:bg-[#F7F8FA]"
                  >
                    {chip.label}
                    <X className="h-3 w-3 text-[#7A839C]" />
                  </button>
                ))}
              </div>
            </div>
            <div className="hidden items-center justify-end gap-3 lg:flex">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="inline-flex h-10 items-center gap-2 rounded-full border border-[#BFC6D4] bg-white px-4 text-sm font-bold text-[#0B1A45] shadow-[0_1px_2px_rgba(11,26,69,0.04)] transition-[background-color,border-color,transform] hover:border-[#0B1A45]/35 hover:bg-[#F7F8FA] active:scale-[0.98]">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                    {activeFilterChips.length > 0 && (
                      <span className="ml-0.5 rounded-full bg-[#F1FFD1] px-1.5 text-[10px] text-[#0B1A45]">
                        {activeFilterChips.length}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[340px] max-w-[calc(100vw-2rem)] overflow-y-auto border-l border-[#DFE1E8] bg-[#F7F8FA] px-5 pb-5">
                  <SheetHeader className="px-0">
                    <SheetTitle className="text-base">Filtrar productos</SheetTitle>
                  </SheetHeader>
                  <CatalogFilters
                    filters={filterState}
                    distributors={distributors}
                    brands={availableBrands}
                    onFilterChange={handleFilterChange}
                    onClear={clearFilters}
                  />
                  <SheetFooter className="px-0">
                    <SheetClose asChild>
                      <button className="h-11 rounded-xl bg-[#0B1A45] text-sm font-bold text-white">
                        Ver resultados
                      </button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <Select value={sortParam} onValueChange={value => updateSearchParams({ sort: value === 'relevance' ? null : value })}>
                <SelectTrigger className="h-10 w-56 rounded-full border-[#DFE1E8] bg-white px-4 text-sm font-bold text-[#0B1A45] shadow-[0_1px_2px_rgba(11,26,69,0.04)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        <div className="mb-4 flex flex-col gap-3 lg:hidden">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <button className="flex h-9 items-center gap-2 rounded-full border border-[#DFE1E8] bg-white/80 px-3 text-xs font-bold text-[#0B1A45] shadow-sm backdrop-blur-sm active:scale-[0.98]">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                  {activeFilterChips.length > 0 && (
                    <span className="rounded-full bg-[#C8FF00] px-1.5 text-[10px] text-[#0B1A45]">
                      {activeFilterChips.length}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[76vh] overflow-y-auto rounded-t-3xl px-4 pb-4">
                <SheetHeader className="px-0">
                  <SheetTitle className="text-base">Filtrar productos</SheetTitle>
                </SheetHeader>
                <CatalogFilters
                  filters={filterState}
                  distributors={distributors}
                  brands={availableBrands}
                  onFilterChange={handleFilterChange}
                  onClear={clearFilters}
                />
                <SheetFooter className="px-0">
                  <SheetClose asChild>
                    <button className="h-11 rounded-xl bg-[#0B1A45] text-sm font-bold text-white">
                      Ver resultados
                    </button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <Select value={sortParam} onValueChange={value => updateSearchParams({ sort: value === 'relevance' ? null : value })}>
              <SelectTrigger className="h-9 flex-1 rounded-full border-[#DFE1E8] bg-white/80 text-xs font-bold text-[#0B1A45] shadow-sm backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {activeFilterChips.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {activeFilterChips.map(chip => (
                <button
                  key={chip.key}
                  onClick={chip.clear}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#DFE1E8] bg-white px-3 py-1.5 text-xs font-bold text-[#0B1A45]"
                >
                  {chip.label}
                  <X className="h-3 w-3 text-[#7A839C]" />
                </button>
              ))}
            </div>
          )}
        </div>

        {normalizedQuery && matchingDistributors.length > 0 && (
          <section className="mb-7">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Distribuidoras
                </p>
                <h2 className="font-heading text-base font-bold tracking-tight text-[#0B1A45] md:text-lg">
                  Proveedores que coinciden
                </h2>
              </div>
              <span className="rounded-full border border-[#DFE1E8] bg-white px-3 py-1 text-xs font-bold text-[#0B1A45] shadow-sm">
                {matchingDistributors.length}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {matchingDistributors.slice(0, 6).map(distributor => (
                <Link
                  key={distributor.id}
                  href={`/comercio/distribuidora/${distributor.id}`}
                  className="group rounded-[1.35rem] border border-[#DFE1E8] bg-white p-3 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_12px_32px_rgba(11,26,69,0.06)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#0B1A45]/20 hover:shadow-[0_16px_42px_rgba(11,26,69,0.10)]"
                >
                  <article className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1FFD1] font-heading text-sm font-bold text-[#0B1A45] ring-1 ring-[#C8FF00]/45">
                      {distributor.initials || distributor.companyName.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold text-[#0B1A45] transition-colors group-hover:text-[#17295C]">
                            {distributor.companyName}
                          </h3>
                          <p className="mt-0.5 truncate text-xs font-medium text-[#7A839C]">
                            {distributor.categories.slice(0, 3).join(' · ')}
                          </p>
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#7A839C] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0B1A45]" />
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-semibold text-[#7A839C]">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {distributor.distance}
                        </span>
                        {distributor.rating ? (
                          <span className="inline-flex items-center gap-1 text-[#0B1A45]">
                            <Star className="h-3.5 w-3.5 fill-current" />
                            {distributor.rating.toFixed(1)}
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <Store className="h-3.5 w-3.5" />
                          Mín. {formatCurrency(distributor.minOrder)}
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="flex-1 min-w-0">
            {isLoading ? (
              <>
                <ProductCardSkeleton count={4} className="px-0 lg:hidden" />
                <ProductCardSkeleton count={8} className="hidden lg:grid" />
              </>
            ) : filteredProducts.length === 0 && matchingDistributors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="h-14 w-14 rounded-2xl bg-white border border-[#DFE1E8] flex items-center justify-center shadow-sm">
                  <Package className="h-7 w-7 text-gray-300" />
                </div>
                <p className="font-bold text-[#0B1A45]">Sin resultados</p>
                <p className="text-sm text-[#7A839C]">Probá con otro término o categoría</p>
                <button
                  onClick={() => { setSearchQuery(''); router.replace('/comercio/buscar') }}
                  className="text-[#0B1A45] text-sm font-semibold underline mt-1"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                {filteredProducts.length > 0 && (
                  <p className="mb-3 text-xs font-medium text-[#7A839C] lg:hidden">
                    {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''} encontrado{filteredProducts.length !== 1 ? 's' : ''}
                  </p>
                )}

                {/* Mobile — 2-col grid */}
                <div className="grid grid-cols-2 gap-2 lg:hidden">
                  {filteredProducts.map((product: Product) => {
                    const dist = distributorMap.get(product.distribuidoraId)
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        distName={dist?.companyName}
                        distDistance={dist?.distance}
                        qty={getQty(product.id)}
                        onQtyChange={v => setQty(product, v)}
                        onAdd={() => handleAdd(product)}
                        justAdded={!!justAdded[product.id]}
                        view="grid"
                      />
                    )
                  })}
                </div>

                {/* Desktop — grid */}
                <div className="hidden lg:grid grid-cols-4 gap-3">
                  {filteredProducts.map((product: Product) => {
                    const dist = distributorMap.get(product.distribuidoraId)
                    return (
                      <ProductCard
                        key={product.id}
                        product={product}
                        distName={dist?.companyName}
                        distDistance={dist?.distance}
                        qty={getQty(product.id)}
                        onQtyChange={v => setQty(product, v)}
                        onAdd={() => handleAdd(product)}
                        justAdded={!!justAdded[product.id]}
                        view="grid"
                      />
                    )
                  })}
                </div>
              </>
            )}
        </section>
      </main>
    </div>
  )
}
