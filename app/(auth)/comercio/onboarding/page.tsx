'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, MapPin, Clock, Package, CheckCircle, Circle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const steps = [
  {
    icon: <Store className="h-10 w-10" />,
    title: 'Tu negocio ya está en StockIA',
    description: 'Encontrá distribuidoras cerca tuyo, pedí productos al por mayor y recibí en tu local.',
  },
  {
    icon: <Package className="h-10 w-10" />,
    title: 'Explorá el catálogo',
    description: 'Bebidas, lácteos, limpieza, snacks y mucho más. Todo desde un solo lugar.',
  },
  {
    icon: <Clock className="h-10 w-10" />,
    title: 'Pedido en minutos',
    description: 'Elegí los productos, pagá con Mercado Pago y coordiná la entrega directamente con la distribuidora.',
  },
  {
    icon: <MapPin className="h-10 w-10" />,
    title: 'Distribuidoras en tu localidad',
    description: 'Conectamos tu negocio con distribuidoras que entregan en tu localidad.',
  },
]

export default function OnboardingComercioPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)

  const isLast = step === steps.length - 1

  const handleNext = () => {
    if (isLast) {
      router.push('/comercio')
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Left panel */}
      <div
        className="bg-primary md:w-1/2 pt-12 md:pt-20 pb-32 px-6 md:px-16 relative overflow-hidden shrink-0 flex flex-col justify-between"
        style={{
          backgroundImage: "url('/assets/login-image.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center right 38%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,43,0.94)_0%,rgba(8,15,43,0.76)_48%,rgba(8,15,43,0.46)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,43,0.24)_0%,rgba(8,15,43,0.86)_100%)]" />

        <div className="relative z-10 flex justify-between items-start w-full">
          <div>
            <p className="text-white/70 text-sm font-medium mb-2 uppercase tracking-widest">StockIA</p>
            <h1 className="font-heading font-bold text-3xl md:text-5xl text-white leading-tight">
              Bienvenido<br />a tu nuevo proveedor
            </h1>
          </div>
          <Link href="/login" className="md:hidden text-white/80 hover:text-white text-sm font-medium">
            Ya tengo cuenta
          </Link>
        </div>

        {/* Desktop step list */}
        <div className="hidden md:flex flex-col gap-8 relative z-10 mt-16">
          {steps.map((s, i) => {
            const isDone = i < step
            const isCurrent = i === step
            return (
              <div
                key={i}
                className={`flex items-center gap-4 transition-opacity duration-300 ${isDone || isCurrent ? 'opacity-100' : 'opacity-40'}`}
              >
                <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0">
                  {isDone ? (
                    <CheckCircle className="h-8 w-8 text-white" />
                  ) : isCurrent ? (
                    <Circle className="h-8 w-8 text-white fill-white/20" />
                  ) : (
                    <Circle className="h-8 w-8 text-white/40" />
                  )}
                </div>
                <span className={`font-heading text-xl text-white ${isCurrent ? 'font-bold' : 'font-medium'}`}>
                  {s.title}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Content panel */}
      <div className="px-6 md:px-0 -mt-20 md:mt-0 relative z-10 flex-1 md:w-1/2 flex flex-col md:justify-center md:items-center pb-10 md:pb-0">
        <div className="hidden md:block absolute top-8 right-12">
          <Link href="/login" className="text-muted-foreground hover:text-foreground text-sm font-medium">
            Ya tengo cuenta
          </Link>
        </div>

        <div className="bg-white rounded-3xl md:rounded-none md:bg-transparent shadow-xl md:shadow-none p-8 md:p-12 flex-1 md:flex-none flex flex-col w-full max-w-lg md:mx-auto">
          {/* Mobile progress bar */}
          <div className="flex md:hidden gap-1.5 mb-8">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-colors duration-300 ${i <= step ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center text-center justify-center gap-8 md:gap-10">
            <div className="h-28 w-28 md:h-32 md:w-32 rounded-3xl bg-[#F1FFD1] text-[#4A662E] flex items-center justify-center shadow-inner relative">
              <div className="absolute inset-0 bg-primary/10 blur-xl rounded-3xl" />
              <div className="relative z-10">
                {steps[step].icon}
              </div>
            </div>
            <div>
              <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-4 leading-tight">
                {steps[step].title}
              </h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed px-4">
                {steps[step].description}
              </p>
            </div>
          </div>

          <div className="mt-12 space-y-4 w-full">
            <Button
              className="w-full h-14 md:h-16 text-lg rounded-xl shadow-lg"
              onClick={handleNext}
            >
              {isLast ? (
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" /> Empezar a comprar
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Siguiente <ChevronRight className="h-5 w-5" />
                </span>
              )}
            </Button>
            {!isLast && (
              <button
                className="w-full text-sm text-muted-foreground py-2 hover:text-foreground transition-colors"
                onClick={() => router.push('/comercio')}
              >
                Saltar tutorial
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
