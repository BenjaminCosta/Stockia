'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  ChevronRight,
  Clock,
  MapPin,
  PackageCheck,
  Search,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from 'lucide-react'
import { DistributorCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'
import { useApp } from '@/lib/app-context'
import { categories, formatCurrency, mockDistributorCards, mockProducts } from '@/lib/mock-data'
import { Category, Comercio, DistributorCard, Product } from '@/lib/types'
import { cn } from '@/lib/utils'

const bannerImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAD5c4yEJhHUZIMP3RN84tkDx7y8cPPOHsG6_E-idBHVVNqIJ5Rs3MUbGmuiHs6TqBmTHgurh_dkjU_ui6dxw6sh8cSMjyYZpF4OQaxM21_lw-wCqL-1li9q80Oqj-YZUcsIzCaJQXG3h4B0nDnblBxa8ZBtT5XFoSzG8S1KHVqbKQfsADKCYe_r2A8T6tBkqztMX3gU2odL_2RV_FFoYq3TfWgZ0P0W_7gbtpmJfWzZ3nEAw0qT-U2zC-PJzKSX_9-4pYOOlwmuxX1'

const categoryStyles = [
  'bg-blue-50 border-blue-100 text-blue-600',
  'bg-emerald-50 border-emerald-100 text-emerald-600',
  'bg-orange-50 border-orange-100 text-orange-600',
  'bg-violet-50 border-violet-100 text-violet-600',
  'bg-red-50 border-red-100 text-primary',
  'bg-amber-50 border-amber-100 text-amber-700',
]

const distributorCovers = [
  'from-[#181D25] to-primary',
  'from-primary to-[#7f1d1d]',
  'from-[#2f3132] to-[#575e70]',
  'from-[#181D25] via-[#312326] to-primary',
]

const distributorBadges = ['Entrega rápida', 'Más pedido', 'Cerca tuyo', 'Mayorista']

function getCategoryImage(product: Product) {
  return categories.find((category) => category.name === product.category)?.image || '/placeholder.svg'
}

function ComercioDistributorCard({
  distributor,
  index,
}: {
  distributor: DistributorCard
  index: number
}) {
  const cover = distributorCovers[index % distributorCovers.length]
  const badge = distributorBadges[index % distributorBadges.length]

  return (
    <Link href={`/comercio/distribuidora/${distributor.id}`} className="group block">
      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(24,29,37,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_20px_50px_rgba(24,29,37,0.12)]">
        <div className={cn('relative h-24 overflow-hidden bg-gradient-to-br', cover)}>
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(45deg,rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:22px_22px,34px_34px]" />
          <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10 blur-sm" />
          <div className="absolute bottom-4 right-5 flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-md">
            <Truck className="h-3.5 w-3.5" />
            {badge}
          </div>
        </div>

        <div className="relative px-5 pb-5">
          <div className="absolute -top-10 left-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-gray-200 bg-white p-1 shadow-lg">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-red-50 font-heading text-xl font-bold text-primary">
              {distributor.initials}
            </div>
          </div>

          <div className="flex items-start justify-between gap-3 pt-12">
            <div className="min-w-0">
              <h3 className="truncate font-heading text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                {distributor.companyName}
              </h3>
              <p className="mt-1 truncate text-sm text-muted-foreground">
                {distributor.categories.join(' · ')}
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
              Abierto
            </span>
          </div>

          <div className="mt-4 flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {distributor.distance}
            </span>
            <span className="h-1 w-1 rounded-full bg-gray-300" />
            <span className="flex items-center gap-1 font-semibold text-amber-600">
              <Star className="h-4 w-4 fill-current" />
              4.{8 + (index % 2)}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-gray-50 p-3 text-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Mínimo</p>
              <p className="mt-1 font-semibold text-foreground">{formatCurrency(distributor.minOrder)}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Entrega</p>
              <p className="mt-1 flex items-center gap-1 font-semibold text-foreground">
                <Clock className="h-3.5 w-3.5 text-primary" />
                {distributor.deliveryInfo.replace('Entrega ', '')}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              {distributor.productCount} productos
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-white">
              Ver catálogo
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}

function CategoryCard({ category, index }: { category: Category; index: number }) {
  const color = categoryStyles[index % categoryStyles.length]

  return (
    <Link
      href={`/comercio/buscar?categoria=${encodeURIComponent(category.name)}`}
      className={cn(
        'group flex min-w-[132px] flex-col items-center justify-center gap-3 rounded-3xl border p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(24,29,37,0.08)] md:min-w-0',
        color
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm transition-shadow group-hover:shadow-md">
        <img
          src={category.image}
          alt={category.name}
          className="h-11 w-11 object-contain drop-shadow-sm"
        />
      </div>
      <span className="font-heading text-sm font-bold leading-tight text-foreground">
        {category.name}
      </span>
    </Link>
  )
}

function ReorderProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <article
      className={cn(
        'rounded-3xl bg-white p-4 shadow-2xl shadow-black/20',
        index === 1 ? 'lg:translate-y-3' : 'lg:-translate-y-3'
      )}
    >
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gray-50 p-5">
        <img
          src={getCategoryImage(product)}
          alt={product.category}
          className="h-full w-full object-contain drop-shadow-sm"
        />
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
          {product.category}
        </p>
        <h3 className="mt-1 min-h-10 font-heading text-sm font-bold leading-snug text-foreground">
          {product.name}
        </h3>
        <p className="mt-2 text-lg font-bold text-primary">{formatCurrency(product.price)}</p>
      </div>
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-primary hover:text-white">
        <ShoppingCart className="h-4 w-4" />
        Repetir
      </button>
    </article>
  )
}

export default function ComercioHomePage() {
  const { currentUser } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const isLoading = useMockLoading()

  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const storeName = comercio?.storeName || 'Tu comercio'
  const currentLocation = comercio?.location

  const filteredDistributors = mockDistributorCards.filter((distributor) => {
    const distributorProducts = mockProducts.filter((product) => product.distribuidoraId === distributor.id)
    const query = searchQuery.toLowerCase()

    return distributor.companyName.toLowerCase().includes(query) ||
      distributor.categories.some((category) => category.toLowerCase().includes(query)) ||
      distributorProducts.some((product) => product.name.toLowerCase().includes(query))
  })

  const lowStockProducts = mockProducts
    .filter((product) => product.stock <= 10)
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
      <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 md:mb-8">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Buen día,</p>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground md:text-4xl">
              {storeName}
            </h1>
            {currentLocation && (
              <div className="mt-2 flex items-center text-sm font-medium text-muted-foreground">
                <MapPin className="mr-1.5 h-4 w-4 text-primary" />
                <span>{currentLocation.city}, {currentLocation.zone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative mb-6 md:hidden">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar productos o distribuidoras..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium shadow-sm outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          />
        </div>

        <section
          className="relative mb-10 flex min-h-[256px] overflow-hidden rounded-[2rem] bg-cover bg-center shadow-[0_20px_60px_rgba(24,29,37,0.14)] md:mb-14 md:min-h-[260px]"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(180,35,24,0.88) 0%, rgba(180,35,24,0.50) 46%, rgba(24,29,37,0.12) 100%), url(${bannerImage})`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.24),transparent_30%)]" />
          <div className="relative z-10 flex max-w-xl flex-col justify-center p-6 text-white md:p-12">
            <span className="mb-4 w-fit rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-wide backdrop-blur-md">
              Nueva temporada 2026
            </span>
            <h2 className="font-heading text-3xl font-bold leading-tight md:text-5xl">
              Optimizá tu inventario con Stockia
            </h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/comercio/buscar"
                className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary shadow-lg transition-transform hover:scale-[0.98]"
              >
                Explorar ofertas
              </Link>
              <Link
                href="/comercio/distribuidoras"
                className="inline-flex items-center justify-center rounded-xl border border-white/70 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Ver catálogo
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-10 md:mb-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                Explorar por categoría
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
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
          <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:px-0">
            {categories.slice(0, 6).map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        </section>

        <section className="mb-10 rounded-[2rem] bg-white/70 p-4 shadow-[0_16px_50px_rgba(24,29,37,0.05)] ring-1 ring-gray-200/70 md:mb-14 md:p-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">
                Distribuidoras destacadas
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
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

          <div className="relative mb-6 hidden max-w-md md:block">
            <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Filtrar distribuidoras o productos..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-4 text-sm font-medium outline-none transition-all focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {isLoading ? (
            <DistributorCardSkeleton />
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              {filteredDistributors.slice(0, 3).map((distributor, index) => (
                <ComercioDistributorCard key={distributor.id} distributor={distributor} index={index} />
              ))}
            </div>
          )}
        </section>

        <section className="relative overflow-hidden rounded-[2rem] bg-[#181D25] p-6 text-white shadow-[0_24px_70px_rgba(24,29,37,0.22)] md:p-10 lg:p-12">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_1.6fr] lg:items-center">
            <div>
              <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white/80">
                <Zap className="h-4 w-4 text-red-200" />
                Reposición rápida
              </span>
              <h2 className="font-heading text-3xl font-bold leading-tight md:text-4xl">
                ¿Se te está terminando el stock?
              </h2>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/75 md:text-lg">
                Repetí tus productos más pedidos en segundos y asegurá el flujo de ventas de la semana.
              </p>
              <Link
                href="/comercio/pedidos"
                className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                Ver historial completo
                <PackageCheck className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {lowStockProducts.map((product, index) => (
                <ReorderProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}
