'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SearchInput } from '@/components/ui/SearchInput'
import {
  ArrowRight,
  ChevronRight,
  Clock,
  MapPin,
  PackageCheck,
  ShoppingCart,
  Star,
  Truck,
  Zap,
} from 'lucide-react'
import { DistributorCardSkeleton } from '@/components/ui/SkeletonCard'
import { useApp } from '@/lib/app-context'
import { categories, formatCurrency } from '@/lib/mock-data'
import { useDistributors, useProducts } from '@/hooks/use-data'
import { Category, Comercio, Product } from '@/lib/types'
import { cn } from '@/lib/utils'
import { DistribuidoraCard } from '@/components/distribuidora-card'

const bannerImage =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD5AyXfk8ajEi26pq48tlS5ch4s6KleLvBpkMakL1s-oa5bQ7Z1FDjB6tw3mmY5OzVH153BMmYuf7viMCuUJPOwpJX5u2_arVtIHwLb3TFVvTSfeyQw8901VqZg4xPG2znYiyo2V4ZadHAjcNaRJrFcNGj2wGDH6ulcZ7-3c0jjHZ-_sheGCoH_CfgECZ2TLcM2DL5Cg9ERywVrxKyLsYBkZDrCV4dM2Qphw2hinMpGymIsoz0VM2rFuKolkzsOq-kHikNxmaOMKzif'

const categoryPhotos: Record<string, string> = {
  'Bebidas':  '/categorias/photos/bebidas.jpg',
  'Limpieza': '/categorias/photos/limpieza.jpg',
  'Lácteos':  '/categorias/photos/lacteos.jpg',
  'Almacén':  '/categorias/photos/almacen.jpg',
}

function getCategoryImage(product: Product) {
  return categories.find((category) => category.name === product.category)?.image || '/placeholder.svg'
}

function CategoryCard({ category }: { category: Category }) {
  const photo = categoryPhotos[category.name]

  return (
    <Link
      href={`/comercio/buscar?categoria=${encodeURIComponent(category.name)}`}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_15px_35px_rgba(11,26,69,0.08)]"
    >
      <div className="h-36 md:h-56 overflow-hidden">
        {photo ? (
          <img
            src={photo}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-50">
            <img src={category.image} alt={category.name} className="h-16 w-16 md:h-20 md:w-20 object-contain" />
          </div>
        )}
      </div>
      <div className="p-4 md:p-5">
        <p className="font-semibold text-[#0B1A45] text-sm md:text-base">{category.name}</p>
      </div>
    </Link>
  )
}

function ReorderProductCard({ product, index }: { product: Product; index: number }) {
  return (
    <article
      className={cn(
        'rounded-2xl bg-white p-3 shadow-xl shadow-black/15',
        index === 1 ? 'lg:translate-y-2' : 'lg:-translate-y-2'
      )}
    >
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-gray-50 p-3">
        <img
          src={getCategoryImage(product)}
          alt={product.category}
          className="h-full w-full object-contain"
        />
      </div>
      <div className="mt-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          {product.category}
        </p>
        <h3 className="mt-0.5 min-h-8 font-heading text-xs font-bold leading-snug text-foreground">
          {product.name}
        </h3>
        <p className="mt-1 text-base font-bold text-primary">{formatCurrency(product.price)}</p>
      </div>
      <button className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-foreground transition-colors hover:bg-primary hover:text-white">
        <ShoppingCart className="h-3.5 w-3.5" />
        Repetir
      </button>
    </article>
  )
}

export default function ComercioHomePage() {
  const { currentUser } = useApp()
  const [searchQuery, setSearchQuery] = useState('')

  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const storeName = comercio?.storeName || 'Tu comercio'
  const currentLocation = comercio?.location

  const { data: distributors, loading: isLoading } = useDistributors(currentLocation ?? undefined)
  const { data: products } = useProducts()

  const filteredDistributors = distributors.filter((distributor) => {
    const distributorProducts = products.filter((product: Product) => product.distribuidoraId === distributor.id)
    const query = searchQuery.toLowerCase()

    return distributor.companyName.toLowerCase().includes(query) ||
      distributor.categories.some((category: string) => category.toLowerCase().includes(query)) ||
      distributorProducts.some((product: Product) => product.name.toLowerCase().includes(query))
  })

  const lowStockProducts = products
    .filter((product: Product) => product.stock <= 10)
    .slice(0, 3)

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f7f8_0%,#ffffff_46%,#f3f4f6_100%)]">
      <section className="mx-auto w-full max-w-[1400px] px-4 py-3 md:px-8 md:py-8">
        <div className="mb-3 md:mb-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Buen día,</p>
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground md:text-4xl">
              {storeName}
            </h1>
            {currentLocation && (
              <div className="mt-1 flex items-center text-xs font-medium text-muted-foreground">
                <MapPin className="mr-1 h-3.5 w-3.5 text-primary" />
                <span>{currentLocation.city}, {currentLocation.zone}</span>
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
          className="relative mb-5 flex min-h-[152px] overflow-hidden rounded-2xl bg-cover bg-center shadow-[0_20px_60px_rgba(24,29,37,0.14)] md:mb-12 md:min-h-[210px] md:rounded-[2rem]"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(11,26,69,0.90) 0%, rgba(11,26,69,0.55) 46%, rgba(24,29,37,0.12) 100%), url(${bannerImage})`,
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,255,255,0.24),transparent_30%)]" />
          <div className="relative z-10 flex max-w-xl flex-col justify-center p-4 text-white md:p-10">
            <span className="mb-2 w-fit rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide backdrop-blur-md md:px-4 md:py-1.5 md:text-xs">
              Nueva temporada 2026
            </span>
            <h2 className="font-heading text-xl font-bold leading-tight md:text-4xl">
              Optimizá tu inventario con Stockia
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/comercio/buscar"
                className="inline-flex items-center justify-center rounded-lg bg-lima px-4 py-1.5 text-xs font-bold text-primary shadow-lg transition-transform hover:scale-[0.98] hover:bg-lima/90 md:rounded-xl md:px-6 md:py-3 md:text-sm"
              >
                Explorar ofertas
              </Link>
              <Link
                href="/comercio/distribuidoras"
                className="inline-flex items-center justify-center rounded-lg border border-white/70 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/10 md:rounded-xl md:px-6 md:py-3 md:text-sm"
              >
                Ver catálogo
              </Link>
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
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {categories
              .filter(c => ['Bebidas', 'Almacén', 'Limpieza', 'Lácteos'].includes(c.name))
              .map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
          </div>
        </section>

        <section className="mb-5 rounded-2xl bg-white/70 p-3 shadow-sm ring-1 ring-gray-200/70 md:mb-12 md:rounded-[2rem] md:p-6 md:shadow-[0_16px_50px_rgba(24,29,37,0.05)]">
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

        <section className="relative overflow-hidden rounded-2xl bg-[#181D25] p-4 text-white md:rounded-[2rem] md:p-8 lg:p-10">
          {/* geometric pattern overlay — estilo header de cuenta */}
          <svg className="absolute inset-0 h-full w-full opacity-[0.045]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <circle cx="85%" cy="15%" r="90" fill="none" stroke="white" strokeWidth="6" />
            <circle cx="15%" cy="80%" r="60" fill="none" stroke="white" strokeWidth="4" />
            <rect x="70%" y="55%" width="80" height="80" fill="none" stroke="white" strokeWidth="5" transform="rotate(20 80 60)" />
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="white" strokeWidth="1" />
            <line x1="0" y1="70%" x2="60%" y2="0" stroke="white" strokeWidth="0.8" />
          </svg>
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 grid gap-5 lg:grid-cols-[0.9fr_1.6fr] lg:items-center md:gap-6">
            <div>
              <h2 className="font-heading text-lg font-bold leading-tight md:text-3xl">
                ¿Se te está terminando el stock?
              </h2>
              <p className="mt-1.5 hidden max-w-md text-sm leading-relaxed text-white/70 md:mt-3 md:block md:text-base">
                Repetí tus productos más pedidos en segundos y asegurá el flujo de ventas de la semana.
              </p>
              <Link
                href="/comercio/pedidos"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-lima px-4 py-2 text-xs font-bold text-primary transition-colors hover:bg-lima/90 md:mt-5 md:px-5 md:py-2.5 md:text-sm"
              >
                Ver historial completo
                <PackageCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Link>
            </div>

            <div className="hidden gap-3 md:grid md:grid-cols-3">
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
