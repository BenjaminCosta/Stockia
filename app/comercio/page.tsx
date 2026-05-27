'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { SearchInput } from '@/components/ui/SearchInput'
import {
  Check,
  ChevronRight,
  MapPin,
  PackageCheck,
  ShoppingCart,
} from 'lucide-react'
import { DistributorCardSkeleton, SkeletonBlock } from '@/components/ui/SkeletonCard'
import { useApp } from '@/lib/app-context'
import { formatCurrency } from '@/lib/mock-data'
import { useDistributors, useProducts, useCategories } from '@/hooks/use-data'
import { Category, Comercio, Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DistribuidoraCard } from '@/components/distribuidora-card'

const bannerImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD5AyXfk8ajEi26pq48tlS5ch4s6KleLvBpkMakL1s-oa5bQ7Z1FDjB6tw3mmY5OzVH153BMmYuf7viMCuUJPOwpJX5u2_arVtIHwLb3TFVvTSfeyQw8901VqZg4xPG2znYiyo2V4ZadHAjcNaRJrFcNGj2wGDH6ulcZ7-3c0jjHZ-_sheGCoH_CfgECZ2TLcM2DL5Cg9ERywVrxKyLsYBkZDrCV4dM2Qphw2hinMpGymIsoz0VM2rFuKolkzsOq-kHikNxmaOMKzif'

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
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-[#0B1A45]">
            <img src={category.image} alt={category.name} className="h-16 w-16 md:h-20 md:w-20 object-contain" />
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
  const outOfStock = product.stock === 0

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

export default function ComercioHomePage() {
  const { currentUser, addToCart } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const [reorderedProducts, setReorderedProducts] = useState<Set<string>>(new Set())

  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const storeName = comercio?.storeName || 'Tu comercio'
  const currentLocation = comercio?.location

  const commerceContext = currentLocation
    ? { lat: currentLocation.lat, lng: currentLocation.lng, citySlug: currentLocation.citySlug }
    : undefined
  const { data: distributors, loading: isLoading } = useDistributors(commerceContext)
  const { data: products } = useProducts()
  const { data: allCategories } = useCategories()
  const { commerceOrders, ordersLoading: isOrdersLoading } = useApp()

  const filteredDistributors = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return distributors.filter((distributor) => {
      const distributorProducts = products.filter((product: Product) => product.distribuidoraId === distributor.id)
      return distributor.companyName.toLowerCase().includes(query) ||
        distributor.categories.some((category: string) => category.toLowerCase().includes(query)) ||
        distributorProducts.some((product: Product) => product.name.toLowerCase().includes(query))
    })
  }, [distributors, products, searchQuery])

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

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
      <section className="mx-auto w-full max-w-[1400px] px-4 py-3 md:px-8 md:py-8">
        <div className="mb-3 md:mb-6">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Buen día</p>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-4xl mt-0.5">
              {storeName}
            </h1>
            {currentLocation && (
              <div className="mt-1.5 flex items-center text-xs font-medium text-muted-foreground">
                <MapPin className="mr-1 h-3 w-3 text-primary" />
                <span>{[currentLocation.city, currentLocation.zone].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-3 md:hidden">
          <SearchInput
            placeholder="Buscar productos o distribuidoras..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        <section
          className="relative mb-5 flex min-h-[230px] overflow-hidden rounded-[1.75rem] border border-white/[0.16] bg-cover bg-center shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_22px_60px_rgba(8,15,43,0.16)] md:mb-12 md:min-h-[340px] md:rounded-[2rem] lg:min-h-[390px]"
          style={{
            backgroundImage: `url(${bannerImage})`,
            backgroundPosition: 'center 48%',
          }}
        >
          <div className="absolute inset-0 scale-[1.03] bg-[linear-gradient(90deg,rgba(8,15,43,0.96)_0%,rgba(8,15,43,0.84)_40%,rgba(8,15,43,0.48)_68%,rgba(24,29,37,0.12)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,43,0.00)_0%,rgba(8,15,43,0.38)_100%)]" />
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
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#080f2b]/[0.55] to-transparent" />

          <div className="relative flex w-full items-center px-5 py-7 text-white md:px-12 md:py-12 lg:px-16">
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

        <section className="mb-6 md:mb-12">
          <div className="mb-3 flex items-end justify-between gap-4">
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
              className="hidden items-center gap-1 text-sm font-bold text-primary hover:underline md:flex"
            >
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {/* Mobile: círculos con scroll horizontal */}
          <div className="md:hidden -mx-4 px-4 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
          <div className="hidden md:block -mx-8 px-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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

        <section className="mb-5 rounded-2xl bg-white border border-[#DFE1E8]/80 p-3 shadow-[0_1px_3px_rgba(11,26,69,0.04),0_6px_20px_rgba(11,26,69,0.05)] md:mb-12 md:rounded-4xl md:p-6">
          <div className="mb-3 flex items-end justify-between gap-4 md:mb-6">
            <div>
              <h2 className="font-heading text-base font-bold text-foreground md:text-2xl">
                Distribuidoras destacadas
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground md:mt-1 md:text-sm">
                Socios logísticos confiables cerca de tu comercio.
              </p>
            </div>
            <Link
              href="/comercio/buscar"
              className="flex items-center gap-1 text-sm font-bold text-primary hover:underline"
            >
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <SearchInput
            placeholder="Filtrar distribuidoras o productos..."
            value={searchQuery}
            onChange={setSearchQuery}
            className="mb-6 hidden max-w-md md:block"
          />

          {isLoading ? (
            <DistributorCardSkeleton />
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3 md:gap-5">
              {filteredDistributors.slice(0, 3).map((distributor, index) => (
                <DistribuidoraCard key={distributor.id} distributor={distributor} index={index} showProductCount={false} />
              ))}
            </div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-2xl bg-[#080f2b] px-4 py-5 text-white shadow-[0_18px_52px_rgba(8,15,43,0.18)] md:rounded-[1.75rem] md:px-8 md:py-7">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-[#0B1A45] opacity-80 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-[#0B1A45]/60 blur-2xl pointer-events-none" />
          <div className="absolute right-1/4 top-0 h-32 w-32 rounded-full bg-lima/[0.04] blur-3xl pointer-events-none" />
          <svg className="absolute inset-0 h-full w-full opacity-[0.04] pointer-events-none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <circle cx="92%" cy="-10%" r="38%" fill="none" stroke="white" strokeWidth="32" />
            <circle cx="8%" cy="110%" r="22%" fill="none" stroke="white" strokeWidth="20" />
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="white" strokeWidth="0.8" opacity="0.6" />
            <line x1="0" y1="70%" x2="70%" y2="0" stroke="white" strokeWidth="0.5" opacity="0.4" />
            <circle cx="15%" cy="30%" r="1.5" fill="white" opacity="0.5" />
            <circle cx="22%" cy="55%" r="1" fill="white" opacity="0.3" />
          </svg>
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,1)_1px,transparent_1px)] bg-size-[18px_18px] opacity-[0.03] pointer-events-none" />
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
        </section>
      </section>
    </main>
  )
}
