'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SearchInput } from '@/components/ui/SearchInput'
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock,
  MapPin,
  Minus,
  Package,
  PackageCheck,
  Plus,
  ShoppingCart,
  Truck,
} from 'lucide-react'
import { DistributorCardSkeleton, SkeletonBlock } from '@/components/ui/SkeletonCard'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useDistributors, useProducts, useCategories } from '@/hooks/use-data'
import { Category, Comercio, DistributorCard as DistributorCardType, Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DistribuidoraCard, DistribuidoraCardCover, distributorCovers } from '@/components/distribuidora-card'
import { InternalHeaderBackground } from '@/components/internal-header-background'

const bannerImage =
  '/assets/banner-image.png'

const categoryPhotos: Record<string, string> = {
  'Bebidas':            '/assets/categories/bebidas.jpg',
  'Almacén':            '/assets/categories/almacen.jpg',
  'Limpieza':           '/assets/categories/limpieza.jpg',
  'Lácteos':            '/assets/categories/lacteos.jpg',
  'Panadería':          '/assets/categories/panaderia.jpg',
  'Snacks':             '/assets/categories/snacks.jpg',
  'Fiambres':           '/assets/categories/fiambres.jpg',
  'Congelados':         '/assets/categories/congelados.jpg',
  'Golosinas y Kiosco': '/assets/categories/golosinas.jpg',
  'Perfumería':         '/assets/categories/perfumeria.jpg',
  'Mascotas':           '/assets/categories/mascotas.jpg',
  'Otros':              '/assets/categories/otros.jpg',
}

const productFilters = ['Todos', 'Ofertas', 'Bebidas', 'Almacén', 'Limpieza'] as const
type ProductFilter = typeof productFilters[number]

function CategoryCard({ category }: { category: Category }) {
  const photo = categoryPhotos[category.name]

  return (
    <Link
      href={`/comercio/buscar?categoria=${encodeURIComponent(category.name)}`}
      className="group relative block cursor-pointer overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(11,26,69,0.12)]"
    >
      <div className="h-36 md:h-56">
        {photo ? (
          <img
            src={photo}
            alt={category.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-[#0B1A45]">
            <img src={category.image} alt={category.name} loading="lazy" className="h-16 w-16 md:h-20 md:w-20 object-contain" />
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/5 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
        <p className="font-semibold text-white text-sm md:text-base">{category.name}</p>
      </div>
    </Link>
  )
}

function ZoneProductCard({
  product,
  distributorName,
  imageSrc,
  qty,
  justAdded,
  onQtyChange,
  onAdd,
}: {
  product: Product
  distributorName: string
  imageSrc: string
  qty: number
  justAdded: boolean
  onQtyChange: (value: number) => void
  onAdd: () => void
}) {
  const outOfStock = product.stock <= 0 || product.status !== 'active'
  const maxQty = Math.max(1, product.stock)

  return (
    <article
      className={cn(
        'group flex h-[226px] w-[318px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#DFE1E8] bg-white shadow-[0_1px_3px_rgba(11,26,69,0.04),0_10px_28px_rgba(11,26,69,0.06)] md:h-[238px] md:w-[360px]',
        'transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#C8D0DF] hover:shadow-[0_6px_18px_rgba(11,26,69,0.08),0_18px_44px_rgba(11,26,69,0.10)]',
        justAdded && 'border-lima shadow-[0_0_0_2px_rgba(200,255,0,0.30),0_16px_38px_rgba(11,26,69,0.08)]',
      )}
    >
      <div className="flex min-h-0 flex-1">
        <Link
          href={`/comercio/producto/${product.id}`}
          className="flex w-30 shrink-0 items-center justify-center bg-white md:w-36"
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <Package className="h-10 w-10 text-[#C8D0DF]" />
          )}
        </Link>

        <div className="flex min-w-0 flex-1 flex-col px-3 pb-2.5 pt-3 md:pt-4">
          <div className="min-w-0">
            <Link href={`/comercio/producto/${product.id}`}>
              <h3 className="line-clamp-2 min-h-9 text-sm font-bold leading-tight text-[#0B1A45] transition-colors group-hover:text-[#17295C] md:min-h-10 md:text-[15px]">
                {product.name}
              </h3>
            </Link>
            <p className="mt-1.5 truncate text-xs font-medium text-[#7A839C] md:mt-2 md:text-sm">
              {distributorName}
            </p>
          </div>

          <div className="mt-3 md:mt-4">
            <p className="font-heading text-lg font-bold text-[#0B1A45] md:text-xl">
              {formatCurrency(product.price)}
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className={cn('text-[11px] font-bold md:text-xs', outOfStock ? 'text-red-500' : 'text-emerald-600')}>
                {outOfStock ? 'Sin stock' : `Stock: ${product.stock} u.`}
              </p>
              {product.isOffer && (
                <span className="rounded-full bg-lima-soft px-2 py-1 text-[10px] font-bold text-primary">
                  Oferta
                </span>
              )}
            </div>
          </div>

          <p className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-[#5F6880] md:text-xs">
            <Truck className="h-3.5 w-3.5 text-primary" />
            Entrega en tu zona
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 px-3 pb-3">
        <div className="flex h-9 w-[116px] items-center justify-between overflow-hidden rounded-xl border border-[#DFE1E8] bg-white md:h-10 md:w-[124px]">
          <button
            type="button"
            onClick={() => onQtyChange(Math.max(1, qty - 1))}
            disabled={qty <= 1 || outOfStock}
            className="flex h-full w-9 items-center justify-center text-primary transition-colors hover:bg-[#F7F8FA] disabled:opacity-35 md:w-10"
          >
            <Minus className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </button>
          <span className="min-w-8 text-center text-sm font-bold text-primary">{qty}</span>
          <button
            type="button"
            onClick={() => onQtyChange(Math.min(maxQty, qty + 1))}
            disabled={qty >= maxQty || outOfStock}
            className="flex h-full w-9 items-center justify-center text-primary transition-colors hover:bg-[#F7F8FA] disabled:opacity-35 md:w-10"
          >
            <Plus className="h-3.5 w-3.5 md:h-4 md:w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={outOfStock}
          className={cn(
            'flex h-9 flex-1 items-center justify-center rounded-xl px-3 text-xs font-bold transition-[transform,background-color,color] duration-150 active:scale-[0.97] md:h-10 md:px-4 md:text-sm',
            justAdded
              ? 'bg-lima-soft text-primary'
              : 'bg-primary text-white hover:bg-[#13265D]',
            outOfStock && 'cursor-not-allowed bg-[#EEF0F4] text-[#9AA3B7] hover:bg-[#EEF0F4] active:scale-100',
          )}
        >
          {justAdded ? 'Agregado' : 'Agregar'}
        </button>
      </div>
    </article>
  )
}

type ReorderProduct = {
  product: Product
  distributorName: string
  orderCount: number
  totalQuantity: number
  lastOrderedAt: number
}

function ReorderProductCard({
  item,
  categoryImage,
  justAdded,
  onReorder,
}: {
  item: ReorderProduct
  categoryImage: string
  justAdded: boolean
  onReorder: (item: ReorderProduct) => void
}) {
  const { product, distributorName, orderCount, totalQuantity } = item
  const outOfStock = product.stock <= 0 || product.status !== 'active'

  return (
    <article
      className={cn(
        'group relative min-h-[166px] overflow-hidden rounded-[1.35rem] border border-white/[0.10] bg-white/[0.075] p-3 text-center',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] transition-[transform,background-color,border-color] duration-180 hover:-translate-y-0.5 hover:border-white/[0.18] hover:bg-white/[0.105]',
        justAdded && 'border-lima/50 bg-lima/[0.10]',
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white/[0.94] p-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.18)] ring-1 ring-white/[0.42]">
        <img
          src={categoryImage}
          alt={product.category}
          loading="lazy"
          className="h-full w-full object-contain"
        />
      </div>
      <div className="mt-2.5 min-w-0">
        <p className="truncate text-[9px] font-bold uppercase tracking-[0.14em] text-white/[0.43]">
          {distributorName}
        </p>
        <h3 className="mx-auto mt-1 line-clamp-2 min-h-9 max-w-[13ch] font-heading text-xs font-bold leading-tight text-white">
          {product.name}
        </h3>
        <p className="mt-1.5 text-[10px] font-semibold text-white/[0.50]">
          {orderCount} {orderCount === 1 ? 'pedido' : 'pedidos'} · {totalQuantity} un.
        </p>
        <p className="mt-0.5 text-xs font-bold text-white/[0.86]">
          {formatCurrency(product.price)}
        </p>
      </div>
      <button
        onClick={() => onReorder(item)}
        disabled={outOfStock}
        aria-label={`Repetir ${product.name}`}
        className={cn(
          'mt-2.5 flex h-8 w-full items-center justify-center gap-1.5 rounded-full px-3 text-[11px] font-bold transition-[transform,background-color,color] duration-150 active:scale-[0.97]',
          justAdded
            ? 'bg-lima-soft text-primary'
            : 'bg-white text-primary hover:bg-white/[0.92]',
          outOfStock && 'cursor-not-allowed bg-white/[0.08] text-white/[0.35] hover:bg-white/[0.08] hover:text-white/[0.35] active:scale-100'
        )}
      >
        {justAdded ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
        <span>{outOfStock ? 'Sin stock' : justAdded ? 'Agregado' : 'Repetir'}</span>
      </button>
    </article>
  )
}

function NearbyDistributorFeature({
  distributor,
  city,
  productCount,
  index = 0,
}: {
  distributor: DistributorCardType
  city?: string
  productCount: number
  index?: number
}) {
  const cover = distributorCovers[index % distributorCovers.length]

  return (
    <Link href={`/comercio/distribuidora/${distributor.id}`} className="group block">
      <article className="grid overflow-hidden rounded-2xl border border-[#DFE1E8] bg-white shadow-[0_1px_3px_rgba(11,26,69,0.04),0_16px_44px_rgba(11,26,69,0.07)] transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-[#C8D0DF] hover:shadow-[0_6px_18px_rgba(11,26,69,0.08),0_22px_56px_rgba(11,26,69,0.11)] md:grid-cols-[220px_1fr_auto] md:items-stretch md:rounded-3xl">
        <DistribuidoraCardCover cover={cover} className="min-h-24 md:min-h-full">
          <div className="relative flex h-full min-h-24 items-center justify-center p-4 md:min-h-32 md:p-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/18 bg-white p-1 shadow-[0_18px_34px_rgba(0,0,0,0.18)] md:h-20 md:w-20 md:rounded-2xl md:p-1.5">
              <div className="flex h-full w-full items-center justify-center rounded-lg bg-lima-soft font-heading text-xl font-bold text-green-dark md:rounded-xl md:text-2xl">
                {distributor.initials}
              </div>
            </div>
          </div>
        </DistribuidoraCardCover>

        <div className="min-w-0 p-3 md:p-5 lg:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lima-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
              <Truck className="h-3 w-3" />
              Entrega en tu zona
            </span>
            {city && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F7F8FA] px-2.5 py-1 text-[11px] font-semibold text-[#5F6880]">
                <MapPin className="h-3 w-3" />
                {city}
              </span>
            )}
          </div>
          <h3 className="mt-2.5 font-heading text-base font-bold tracking-tight text-foreground md:mt-3 md:text-2xl">
            {distributor.companyName}
          </h3>
          <p className="mt-1 max-w-[58ch] text-xs font-medium leading-relaxed text-muted-foreground md:text-sm">
            {distributor.categories.slice(0, 3).join(' · ')}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-1.5 text-[10px] font-semibold text-[#5F6880] sm:gap-2 sm:text-xs md:mt-4">
            <div className="min-w-0 rounded-xl border border-[#DFE1E8]/80 bg-[#F7F8FA] px-2 py-2 sm:px-3">
              <p className="truncate text-[8px] font-bold uppercase tracking-[0.10em] text-[#7A839C] sm:text-[9px] sm:tracking-[0.14em]">Mínimo</p>
              <p className="mt-1 truncate text-foreground">{formatCurrency(distributor.minOrder)}</p>
            </div>
            <div className="min-w-0 rounded-xl border border-[#DFE1E8]/80 bg-[#F7F8FA] px-2 py-2 sm:px-3">
              <p className="truncate text-[8px] font-bold uppercase tracking-[0.10em] text-[#7A839C] sm:text-[9px] sm:tracking-[0.14em]">Entrega</p>
              <p className="mt-1 flex min-w-0 items-center gap-1 text-foreground">
                <Clock className="h-3 w-3 shrink-0 text-primary sm:h-3.5 sm:w-3.5" />
                <span className="truncate">{distributor.deliveryInfo.replace('Entrega ', '')}</span>
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-[#DFE1E8]/80 bg-[#F7F8FA] px-2 py-2 sm:px-3">
              <p className="truncate text-[8px] font-bold uppercase tracking-[0.10em] text-[#7A839C] sm:text-[9px] sm:tracking-[0.14em]">Catálogo</p>
              <p className="mt-1 truncate text-foreground">
                <span className="sm:hidden">{productCount} prod.</span>
                <span className="hidden sm:inline">{productCount} {productCount === 1 ? 'producto' : 'productos'}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center border-t border-[#DFE1E8] p-3 md:border-l md:border-t-0 md:p-5">
          <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-[transform,background-color] duration-150 group-hover:bg-primary/92 group-active:scale-[0.98] md:w-auto md:whitespace-nowrap md:py-2.5 md:text-sm">
            Ver productos
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </article>
    </Link>
  )
}

export default function ComercioHomePage() {
  const { currentUser, addToCart } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeProductFilter, setActiveProductFilter] = useState<ProductFilter>('Todos')
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({})
  const [addedProducts, setAddedProducts] = useState<Set<string>>(new Set())
  const [reorderedProducts, setReorderedProducts] = useState<Set<string>>(new Set())

  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const currentLocation = comercio?.location

  const commerceContext = currentLocation
    ? { lat: currentLocation.lat ?? undefined, lng: currentLocation.lng ?? undefined, locationKey: currentLocation.locationKey, citySlug: currentLocation.citySlug, provinceSlug: currentLocation.provinceSlug }
    : undefined
  const { data: distributors, loading: isLoading } = useDistributors(commerceContext)
  const { data: products } = useProducts()
  const { data: allCategories } = useCategories()
  const { commerceOrders, ordersLoading: isOrdersLoading } = useApp()
  const distributorMap = useMemo(() => new Map(distributors.map(distributor => [distributor.id, distributor])), [distributors])

  const filteredDistributors = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return distributors.filter((distributor) => {
      const distributorProducts = products.filter((product: Product) => product.distribuidoraId === distributor.id)
      return distributor.companyName.toLowerCase().includes(query) ||
        distributor.categories.some((category: string) => category.toLowerCase().includes(query)) ||
        distributorProducts.some((product: Product) => product.name.toLowerCase().includes(query))
    })
  }, [distributors, products, searchQuery])

  const zoneProducts = useMemo(() => {
    const distributorIds = new Set(distributors.map(distributor => distributor.id))

    return products
      .filter((product: Product) =>
        distributorIds.has(product.distribuidoraId) &&
        product.status === 'active' &&
        product.stock > 0
      )
      .filter((product: Product) => {
        if (activeProductFilter === 'Todos') return true
        if (activeProductFilter === 'Ofertas') return product.isOffer === true
        return product.category === activeProductFilter
      })
      .sort((a: Product, b: Product) =>
        Number(b.isOffer === true) - Number(a.isOffer === true) ||
        b.stock - a.stock ||
        a.name.localeCompare(b.name, 'es')
      )
      .slice(0, 8)
  }, [activeProductFilter, distributors, products])

  const reorderProducts = useMemo(() => {
    const productById = new Map(products.map((product: Product) => [product.id, product]))
    const byProduct = new Map<string, ReorderProduct>()

    commerceOrders.forEach(order => {
      const orderedAt = new Date(order.createdAt).getTime() || 0

      order.items.forEach(item => {
        const product = productById.get(item.productId)
        if (!product) return

        const existing = byProduct.get(item.productId)
        byProduct.set(item.productId, {
          product,
          distributorName:
            !existing || orderedAt >= existing.lastOrderedAt
              ? order.distribuidoraName
              : existing.distributorName,
          orderCount: (existing?.orderCount ?? 0) + 1,
          totalQuantity: (existing?.totalQuantity ?? 0) + item.quantity,
          lastOrderedAt: Math.max(existing?.lastOrderedAt ?? 0, orderedAt),
        })
      })
    })

    return Array.from(byProduct.values())
      .sort((a, b) =>
        b.totalQuantity - a.totalQuantity ||
        b.orderCount - a.orderCount ||
        b.lastOrderedAt - a.lastOrderedAt
      )
      .slice(0, 3)
  }, [commerceOrders, products])

  const hasReorderProducts = reorderProducts.length > 0
  const locationLabel = [currentLocation?.city, currentLocation?.province].filter(Boolean).join(', ')
  const getProductQuantity = (productId: string) => productQuantities[productId] ?? 1
  const getDistributorProductCount = (distributorId: string) =>
    products.filter((product: Product) =>
      product.distribuidoraId === distributorId &&
      product.status !== 'paused'
    ).length

  const handleReorder = (item: ReorderProduct) => {
    const added = addToCart(item.product, item.distributorName, 1)
    if (!added) return

    setReorderedProducts(prev => new Set(prev).add(item.product.id))
    window.setTimeout(() => {
      setReorderedProducts(prev => {
        const next = new Set(prev)
        next.delete(item.product.id)
        return next
      })
    }, 1400)
  }

  const setProductQty = (product: Product, value: number) => {
    setProductQuantities(prev => ({
      ...prev,
      [product.id]: Math.min(Math.max(1, value), Math.max(1, product.stock)),
    }))
  }

  const handleProductAdd = (product: Product) => {
    const distributorName = distributorMap.get(product.distribuidoraId)?.companyName ?? 'Distribuidora'
    const added = addToCart(product, distributorName, getProductQuantity(product.id))
    if (!added) return

    setAddedProducts(prev => new Set(prev).add(product.id))
    window.setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev)
        next.delete(product.id)
        return next
      })
    }, 1400)
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
      <section className="relative overflow-hidden bg-[#080f2b]">
        <section
          className="relative flex min-h-[285px] w-full overflow-hidden bg-cover bg-center md:min-h-[390px] lg:min-h-[440px]"
          style={{
            backgroundImage: `url(${bannerImage})`,
            backgroundPosition: 'center 48%',
          }}
        >
          <div className="absolute inset-0 scale-[1.02] bg-[linear-gradient(90deg,rgba(8,15,43,0.98)_0%,rgba(8,15,43,0.90)_38%,rgba(8,15,43,0.54)_67%,rgba(8,15,43,0.14)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,43,0.20)_0%,rgba(8,15,43,0.16)_54%,rgba(8,15,43,0.76)_100%)]" />
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.075] mix-blend-screen"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <pattern id="commerce-hero-grid" width="86" height="86" patternUnits="userSpaceOnUse">
                <path d="M0 43H86M43 0V86" stroke="white" strokeWidth="0.6" opacity="0.34" />
                <path d="M17 17h16v16H17zM54 52h18v18H54z" fill="none" stroke="white" strokeWidth="0.7" opacity="0.35" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#commerce-hero-grid)" />
            <path d="M-40 255C120 188 188 226 322 148C456 70 565 104 724 34" fill="none" stroke="white" strokeWidth="1.2" strokeDasharray="8 14" opacity="0.5" />
            <path d="M52 258h58m-29-29v58M720 68h52m-26-26v52" stroke="white" strokeWidth="1" opacity="0.38" />
          </svg>
          <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#080f2b]/[0.72] to-transparent" />

          <div className="relative mx-auto flex w-full max-w-[1400px] items-center px-3 py-8 text-white md:px-6 md:py-12 lg:py-14">
            <div className="w-full max-w-[840px]">
              <span className="mb-3 inline-flex w-fit items-center rounded-full border border-white/[0.22] bg-white/[0.10] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/[0.92] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-md md:mb-5 md:px-4 md:py-1.5 md:text-xs">
                STOCKIA PARA COMERCIOS
              </span>
              <h2 className="max-w-[780px] font-heading text-[2rem] font-bold leading-[0.98] tracking-tight text-white md:text-6xl">
                Tu reposición mayorista, en un solo lugar
              </h2>
              <p className="mt-4 max-w-[610px] text-sm font-medium leading-relaxed text-white/[0.82] md:mt-5 md:text-lg">
                Comprá productos, repetí pedidos y seguí entregas desde Stockia.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
                <Link
                  href="/comercio/buscar"
                  className="relative isolate inline-flex min-h-11 items-center justify-center overflow-hidden rounded-xl border border-lima/[0.42] bg-lima/[0.78] px-4 py-2.5 text-xs font-bold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.52),inset_0_-1px_0_rgba(8,15,43,0.10),0_14px_28px_rgba(8,15,43,0.18)] backdrop-blur-xl transition-[transform,background-color,border-color] duration-150 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/[0.70] before:content-[''] hover:border-lima/[0.58] hover:bg-lima/[0.88] active:scale-[0.98] md:px-6 md:py-3 md:text-sm"
                >
                  <span className="relative">Ver ofertas mayoristas</span>
                </Link>
                <Link
                  href="/comercio/distribuidoras"
                  className="relative isolate inline-flex min-h-11 items-center justify-center overflow-hidden rounded-xl border border-white/[0.24] bg-white/[0.10] px-4 py-2.5 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_12px_24px_rgba(8,15,43,0.16)] backdrop-blur-xl transition-[transform,background-color,border-color] duration-150 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-white/[0.42] before:content-[''] hover:border-white/[0.38] hover:bg-white/[0.16] active:scale-[0.98] md:px-6 md:py-3 md:text-sm"
                >
                  <span className="relative">Explorar distribuidoras</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="mx-auto w-full max-w-[1400px] px-3 py-8 md:px-6 md:py-14">
        <section className="mb-12 md:mb-20">
          <div className="mb-5 flex items-end justify-between gap-4 md:mb-7">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground md:text-2xl">
                Explorar por categoría
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
                Accesos rápidos para reponer lo que más rota.
              </p>
            </div>
            <Link
              href="/comercio/buscar"
              className="flex shrink-0 items-center gap-1 text-xs font-bold text-primary hover:underline md:text-sm"
            >
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {/* Mobile: círculos con scroll horizontal */}
          <div className="md:hidden -mx-3 px-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-4 w-max">
              {allCategories.map(category => {
                const photo = categoryPhotos[category.name]
                return (
                  <Link
                    key={category.id}
                    href={`/comercio/buscar?categoria=${encodeURIComponent(category.name)}`}
                    className="shrink-0 flex flex-col items-center gap-1.5 w-18 active:opacity-70 transition-opacity duration-100"
                  >
                    <div className="w-14.5 h-14.5 rounded-full overflow-hidden border border-[#DFE1E8] bg-white shadow-[0_1px_4px_rgba(11,26,69,0.06)]">
                      {photo ? (
                        <img src={photo} alt={category.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#F7F8FA]">
                          <img src={category.image} alt={category.name} className="w-8 h-8 object-contain" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-[#374151] text-center leading-tight">{category.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Desktop: carousel de cards con imagen completa */}
          <div className="hidden md:block -mx-6 px-6 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <div className="flex gap-4 w-max">
              {allCategories.map(category => {
                const photo = categoryPhotos[category.name]
                return (
                  <Link
                    key={category.id}
                    href={`/comercio/buscar?categoria=${encodeURIComponent(category.name)}`}
                    className="group relative shrink-0 w-72 h-56 rounded-2xl overflow-hidden shadow-sm cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(11,26,69,0.12)]"
                  >
                    {photo ? (
                      <img
                        src={photo}
                        alt={category.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-[#0B1A45]">
                        <img src={category.image} alt={category.name} className="h-16 w-16 object-contain" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/5 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="font-semibold text-white text-sm leading-tight">{category.name}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mb-14 md:mb-24">
          <div className="mb-5 flex items-end justify-between gap-4 md:mb-6">
            <div>
              <h2 className="font-heading text-base font-bold tracking-tight text-foreground md:text-4xl">
                Productos disponibles en tu zona
              </h2>
              <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-muted-foreground md:mt-1.5 md:text-base">
                Comprá directo a distribuidoras que entregan en tu zona.
              </p>
            </div>
            <Link
              href="/comercio/buscar"
              className="hidden items-center gap-1 text-sm font-bold text-primary hover:underline md:flex"
            >
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="-mx-3 mb-5 overflow-x-auto px-3 pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:px-0">
            <div className="flex w-max gap-2">
              {productFilters.map(filter => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveProductFilter(filter)}
                  className={cn(
                    'h-8 rounded-full border px-3 text-xs font-bold transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] md:h-10 md:px-4 md:text-sm',
                    activeProductFilter === filter
                      ? 'border-primary bg-primary text-white shadow-[0_8px_18px_rgba(11,26,69,0.14)]'
                      : 'border-[#DFE1E8] bg-white text-[#5F6880] hover:border-[#C8D0DF] hover:text-primary',
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {zoneProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#C8D0DF] bg-white/70 px-4 py-8 text-center">
              <p className="font-heading text-sm font-bold text-foreground">Sin productos para este filtro</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Probá con otra categoría o explorá el catálogo completo.
              </p>
            </div>
          ) : (
            <div className="-mx-3 overflow-x-auto px-3 pb-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:px-0">
              <div className="flex w-max gap-3 md:gap-4">
                {zoneProducts.map(product => {
                  const imageSrc = product.imageUrl ?? ''

                  return (
                    <ZoneProductCard
                      key={product.id}
                      product={product}
                      distributorName={distributorMap.get(product.distribuidoraId)?.companyName ?? 'Distribuidora'}
                      imageSrc={imageSrc}
                      qty={getProductQuantity(product.id)}
                      justAdded={addedProducts.has(product.id)}
                      onQtyChange={value => setProductQty(product, value)}
                      onAdd={() => handleProductAdd(product)}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </section>

        <section className="mb-14 border-t border-[#DFE1E8]/80 pt-10 md:mb-24 md:pt-16">
          <div className="mb-7 grid gap-5 md:mb-9 md:grid-cols-[1fr_minmax(260px,420px)] md:items-end">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-green-dark md:text-xs">
                Proveedores disponibles
              </p>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-4xl">
                Distribuidoras cercanas
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {locationLabel
                  ? `Comprá directo a proveedores que cubren ${locationLabel}.`
                  : 'Proveedores que entregan en tu zona.'}
              </p>
            </div>
            <div className="flex flex-col gap-3 md:items-end">
              <SearchInput
                placeholder="Buscar distribuidora..."
                value={searchQuery}
                onChange={setSearchQuery}
                className="w-full md:max-w-[420px]"
              />
              <Link
                href="/comercio/distribuidoras"
                className="inline-flex items-center gap-1 self-start text-sm font-bold text-primary hover:underline md:self-auto"
              >
                Ver todas
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 md:gap-5">
              <DistributorCardSkeleton />
            </div>
          ) : !currentLocation?.city ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#C8D0DF] bg-white/70 px-4 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F8FA] border border-[#DFE1E8]/80">
                <MapPin className="h-5 w-5 text-[#7A839C]" />
              </div>
              <div>
                <p className="font-heading font-bold text-foreground text-sm">Ubicación no configurada</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[22ch] leading-relaxed">
                  Completá tu ubicación para ver distribuidoras disponibles.
                </p>
              </div>
              <Link
                href="/comercio/cuenta"
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white transition-[transform,background-color] duration-150 hover:bg-primary/90 active:scale-[0.97]"
              >
                <MapPin className="h-3.5 w-3.5" />
                Completar ubicación
              </Link>
            </div>
          ) : filteredDistributors.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[#C8D0DF] bg-white/70 px-4 py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F8FA] border border-[#DFE1E8]/80">
                <MapPin className="h-5 w-5 text-[#7A839C]" />
              </div>
              <div>
                <p className="font-heading font-bold text-foreground text-sm">Sin distribuidoras en tu zona</p>
                <p className="mt-1 text-xs text-muted-foreground max-w-[28ch] leading-relaxed">
                  Todavía no hay distribuidoras que entreguen en {[currentLocation.city, currentLocation.province].filter(Boolean).join(', ')}.
                </p>
              </div>
              <Link
                href="/comercio/cuenta"
                className="text-xs font-bold text-primary hover:underline"
              >
                Editar ubicación
              </Link>
            </div>
          ) : filteredDistributors.length === 1 ? (
            <div className="space-y-3">
              <div className="md:hidden">
                <DistribuidoraCard distributor={filteredDistributors[0]} index={0} />
              </div>
              <div className="hidden md:block">
                <NearbyDistributorFeature
                  distributor={filteredDistributors[0]}
                  city={currentLocation.city}
                  productCount={getDistributorProductCount(filteredDistributors[0].id)}
                />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Pronto vas a ver más distribuidoras disponibles en tu zona.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {filteredDistributors.slice(0, 3).map((distributor, index) => (
                  <DistribuidoraCard key={distributor.id} distributor={distributor} index={index} />
                ))}
              </div>
              <div className="hidden grid-cols-1 gap-3 md:grid lg:grid-cols-3 md:gap-5">
                {filteredDistributors.slice(0, 3).map((distributor, index) => (
                  <DistribuidoraCard key={distributor.id} distributor={distributor} index={index} showProductCount={false} />
                ))}
              </div>
            </>
          )}
        </section>

        <InternalHeaderBackground as="section" className="rounded-2xl px-3 py-6 text-white shadow-[0_18px_52px_rgba(8,15,43,0.18)] md:rounded-[1.75rem] md:px-6 md:py-9">
          <div className="relative z-10 grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-center md:gap-6">
            <div>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-lima/[0.60] md:text-xs">
                Reposición rápida
              </p>
              <h2 className="max-w-md font-heading text-lg font-bold leading-tight tracking-tight md:text-[2rem]">
                {hasReorderProducts ? '¿Se te está terminando el stock?' : 'Tu historial de reposición'}
              </h2>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/[0.68] md:mt-3 md:text-base">
                {hasReorderProducts
                  ? 'Repetí tus productos más pedidos en segundos y asegurá el flujo de ventas de la semana.'
                  : 'Cuando hagas pedidos, acá vas a ver tus productos más repetidos para volver a comprarlos rápido.'}
              </p>
              <Link
                href="/comercio/pedidos"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-lima px-4 py-2 text-xs font-bold text-primary transition-[transform,background-color] duration-150 hover:bg-lima/90 active:scale-[0.97] md:mt-5 md:px-5 md:py-2.5 md:text-sm"
              >
                Ver historial completo
                <PackageCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Link>
            </div>

            <div className="border-t border-white/[0.10] pt-3 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/[0.55]">
                  Productos frecuentes
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-3">
                {isOrdersLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-[166px] rounded-[1.35rem] border border-white/[0.08] bg-white/[0.075] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                    >
                      <div className="flex h-full flex-col items-center justify-between text-center">
                        <SkeletonBlock className="h-14 w-14 rounded-full bg-white/[0.14]" />
                        <div className="w-full space-y-2">
                          <SkeletonBlock className="mx-auto h-3 w-3/4 bg-white/[0.14]" />
                          <SkeletonBlock className="mx-auto h-3 w-1/2 bg-white/[0.11]" />
                        </div>
                        <SkeletonBlock className="h-8 w-full rounded-xl bg-white/[0.14]" />
                      </div>
                    </div>
                  ))
                ) : hasReorderProducts ? (
                  reorderProducts.map((item) => (
                    <ReorderProductCard
                      key={item.product.id}
                      item={item}
                      justAdded={reorderedProducts.has(item.product.id)}
                      onReorder={handleReorder}
                      categoryImage={allCategories.find(c => c.name === item.product.category)?.image ?? '/placeholder.svg'}
                    />
                  ))
                ) : (
                  <div className="rounded-xl border border-white/[0.10] bg-white/[0.08] p-5 text-sm font-medium leading-relaxed text-white/70 sm:col-span-3">
                    Todavía no hay productos repetidos en tu historial.
                  </div>
                )}
              </div>
            </div>
          </div>
        </InternalHeaderBackground>
      </section>
    </main>
  )
}
