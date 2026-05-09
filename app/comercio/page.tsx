'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, ChevronRight, ShoppingCart, Star, Clock } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { mockDistributorCards, categories, formatCurrency, mockProducts } from '@/lib/mock-data'
import { Comercio } from '@/lib/types'
import { CategoryIcon } from '@/components/category-icon'
import { DistributorCardSkeleton } from '@/components/ui/SkeletonCard'
import { useMockLoading } from '@/hooks/use-mock-loading'

export default function ComercioHomePage() {
  const { currentUser, getCartItemCount } = useApp()
  const [searchQuery, setSearchQuery] = useState('')
  const isLoading = useMockLoading()
  const cartItemCount = getCartItemCount()

  const comercio = currentUser as Comercio | null
  const storeName = comercio?.storeName || 'Tu comercio'
  const currentLocation = comercio?.location

  const filteredDistributors = mockDistributorCards.filter((distributor) => {
    const distributorProducts = mockProducts.filter((product) => product.distribuidoraId === distributor.id)
    return distributor.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      distributor.categories.some((category) => category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      distributorProducts.some((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase()))
  })

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="px-4 md:px-8 pt-4 pb-4 max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="font-heading font-bold text-xl md:text-3xl text-gray-900">
                Buen día, {storeName}
              </h1>
              {currentLocation && (
                <div className="flex items-center text-muted-foreground text-sm mt-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{currentLocation.city}, {currentLocation.zone}</span>
                </div>
              )}
            </div>
            <Link
              href="/comercio/carrito"
              className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center relative hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="h-5 w-5 text-foreground" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos o distribuidoras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-100 border-none rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
        {/* Hero banner */}
        <div className="bg-primary rounded-2xl md:rounded-3xl p-6 md:p-10 relative overflow-hidden shadow-md mb-8 md:mb-12">
          <svg className="absolute right-0 top-0 h-full opacity-10 w-1/2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,0 L100,0 L100,100 Z" fill="white" />
            <circle cx="80" cy="50" r="20" fill="white" />
          </svg>
          <div className="relative z-10 md:max-w-md">
            <h2 className="font-heading font-bold text-white text-xl md:text-3xl leading-tight mb-4 md:mb-6">
              Nuevas distribuidoras en tu zona
            </h2>
            <Link href="/comercio/buscar">
              <button className="bg-white text-primary text-sm md:text-base font-bold px-6 py-3 rounded-full hover:bg-red-50 transition-colors shadow-sm">
                Ver novedades
              </button>
            </Link>
          </div>
        </div>

        {/* Categories */}
        <section className="mb-8 md:mb-12">
          <h2 className="font-heading font-bold text-lg md:text-2xl text-gray-900 mb-4 md:mb-6">Categorías</h2>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/comercio/buscar?categoria=${category.name}`}
                className="flex flex-col items-center p-3 bg-white rounded-xl border border-border hover:border-primary/30 hover:bg-red-50 transition-colors group"
              >
                <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-primary group-hover:bg-primary/10 transition-colors">
                  <CategoryIcon category={category.name} className="h-5 w-5" />
                </span>
                <span className="text-xs text-center text-muted-foreground">{category.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Distributors */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="font-heading font-bold text-lg md:text-2xl text-gray-900">Distribuidoras cercanas</h2>
            <Link href="/comercio/buscar" className="text-sm md:text-base font-medium text-primary hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <DistributorCardSkeleton />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {filteredDistributors.map((distributor) => (
                <Link key={distributor.id} href={`/comercio/distribuidora/${distributor.id}`}>
                  <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-border hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 md:h-16 md:w-16 rounded-xl md:rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-lg md:text-xl shrink-0 group-hover:bg-red-50 group-hover:text-primary transition-colors">
                        {distributor.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-bold text-gray-900 md:text-lg leading-tight group-hover:text-primary transition-colors">
                          {distributor.companyName}
                        </h3>
                        <div className="flex items-center text-xs md:text-sm text-muted-foreground mt-1.5 gap-2">
                          <span className="flex items-center gap-0.5">
                            <MapPin className="h-3 w-3 md:h-4 md:w-4" /> {distributor.distance}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="flex items-center gap-0.5 text-yellow-600 font-medium">
                            <Star className="h-3 w-3 md:h-4 md:w-4 fill-current" /> 4.8
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-gray-100 grid grid-cols-2 gap-2 md:gap-4 text-xs md:text-sm">
                      <div>
                        <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-[10px] md:text-xs font-bold">Mínimo</span>
                        <span className="font-medium text-gray-900">{formatCurrency(distributor.minOrder)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block mb-1 uppercase tracking-wider text-[10px] md:text-xs font-bold">Entrega</span>
                        <span className="font-medium text-gray-900 flex items-center gap-1">
                          <Clock className="h-3 w-3 md:h-4 md:w-4" /> {distributor.deliveryInfo}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
