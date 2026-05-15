'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Boxes,
  Building2,
  Check,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Route,
  Store,
  Truck,
} from 'lucide-react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { upsertUser, upsertCommerce } from '@/lib/data/users.service'
import { upsertDistributor } from '@/lib/data/distributors.service'
import { setSessionCookie } from '@/lib/cookies'
// useApp no longer needed — auth handled via Firebase directly
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserRole } from '@/lib/types'

function registroErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'Ya existe una cuenta con ese email.'
    case 'auth/invalid-email':        return 'El email no tiene un formato válido.'
    case 'auth/weak-password':        return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/network-request-failed': return 'Sin conexión. Verificá tu internet.'
    default:                          return 'Ocurrió un error. Intentá de nuevo.'
  }
}

type OnboardingStep = 1 | 2 | 3 | 4

const steps = [
  { number: 1, label: 'Inicio' },
  { number: 2, label: 'Cuenta' },
  { number: 3, label: 'Datos' },
  { number: 4, label: 'Ubicación' },
]

const zones = ['Avellaneda', 'Lanús', 'Quilmes', 'Lomas de Zamora', 'Berazategui']

export default function RegistroPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>(1)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Business data
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [cityZone, setCityZone] = useState('Avellaneda')
  const [coverageRadius, setCoverageRadius] = useState('15')
  const [deliveryZones, setDeliveryZones] = useState('Avellaneda, Lanús, Quilmes')

  const progress = `${(step / steps.length) * 100}%`
  const title =
    step === 1
      ? 'Comprá y gestioná stock de forma simple'
      : step === 2
        ? 'Elegí tu tipo de cuenta'
        : step === 3
          ? role === 'distribuidora'
            ? 'Datos de la empresa'
            : 'Datos del comercio'
          : role === 'distribuidora'
            ? 'Cobertura de entrega'
            : 'Ubicación del comercio'

  const description =
    step === 1
      ? 'Conectá comercios locales con distribuidoras para pedir, vender y organizar operaciones B2B.'
      : step === 2
        ? 'Esta selección define la navegación y las herramientas principales del prototipo.'
        : step === 3
          ? 'Completá la información básica para configurar el perfil inicial.'
          : role === 'distribuidora'
            ? 'Definí el radio y las zonas donde tu distribuidora reparte pedidos.'
            : 'Confirmá la zona para mostrar proveedores cercanos desde el inicio.'

  const canContinue =
    (step === 1) ||
    (step === 2 && !!role) ||
    (step === 3 && email.trim().length > 0 && password.length >= 6) ||
    (step === 4)

  const handleContinue = async () => {
    if (!canContinue) return

    if (step < 4) {
      setStep((current) => (current + 1) as OnboardingStep)
      return
    }

    if (!role) return
    setError(null)
    setIsLoading(true)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const uid = credential.user.uid
      const name = businessName || email.split('@')[0]

      await upsertUser(uid, { name, email: email.trim(), role })

      if (role === 'comercio') {
        await upsertCommerce(uid, {
          userId: uid,
          businessName: name,
          phone,
          address,
          city: cityZone,
          province: 'Buenos Aires',
          lat: 0,
          lng: 0,
          status: 'active',
        })
      } else {
        await upsertDistributor(uid, {
          userId: uid,
          companyName: name,
          phone,
          address,
          city: cityZone,
          province: 'Buenos Aires',
          lat: 0,
          lng: 0,
          coverageRadiusKm: parseFloat(coverageRadius) || 15,
          minimumOrder: 0,
          categories: [],
          status: 'active',
          deliveryZones: deliveryZones.split(',').map(z => z.trim()).filter(Boolean),
        })
      }

      // Set session cookies immediately so middleware allows the redirect
      setSessionCookie(role)
      router.push(role === 'comercio' ? '/comercio' : '/distribuidora')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(registroErrorMessage(code))
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 1) {
      router.push('/login')
      return
    }
    setStep((current) => (current - 1) as OnboardingStep)
  }

  const selectZone = (zone: string) => {
    if (role === 'distribuidora') {
      const selectedZones = deliveryZones.split(',').map(item => item.trim()).filter(Boolean)
      setDeliveryZones(
        selectedZones.includes(zone)
          ? selectedZones.filter(item => item !== zone).join(', ')
          : [...selectedZones, zone].join(', ')
      )
      return
    }

    setCityZone(zone)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header
        className="relative overflow-hidden px-4 pb-28 pt-6 text-white md:px-8 md:pb-32 md:pt-8"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1672552226380-486fe900b322?q=95&w=3840&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-sidebar/90" />
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute -left-10 top-16 h-28 w-28 rounded-3xl border border-white rotate-12" />
          <div className="absolute right-8 top-20 h-20 w-20 rounded-full border border-white" />
          <div className="absolute bottom-12 left-1/2 h-px w-56 -translate-x-1/2 rotate-[-18deg] bg-white" />
          <Boxes className="absolute bottom-8 right-16 h-20 w-20 text-white" />
          <Route className="absolute left-14 top-40 h-16 w-16 text-white" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <Link href="/login" className="flex items-center gap-2 rounded-full px-2 py-2 text-sm font-medium text-white/75 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Link>
            <div className="h-10 w-10" />
            <div className="w-16" />
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_520px] md:items-end">
            <div className="max-w-2xl">
              <p className="mb-3 text-sm font-medium uppercase tracking-[0.14em] text-white/55">
                Paso {step} de {steps.length}
              </p>
              <h1 className="font-heading text-3xl font-bold leading-tight text-white md:text-4xl">
                {title}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-white/72 md:text-lg">
                {description}
              </p>
            </div>

            <div className="hidden md:block">
              <DesktopStepper currentStep={step} />
            </div>
          </div>

          <div className="mt-8 md:hidden">
            <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-[0.12em] text-white/65">
              <span>{steps[step - 1].label}</span>
              <span>{Math.round((step / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-primary transition-all duration-300 ease-out" style={{ width: progress }} />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-32 md:px-8">
        <section className="-mt-20 rounded-2xl border border-border bg-card p-5 shadow-[0_18px_45px_-24px_rgba(31,41,55,0.45)] md:-mt-24 md:p-8">
          <div key={step} className="animate-onboarding-step">
            {step === 1 && (
              <WelcomeStep />
            )}

            {step === 2 && (
              <RoleStep role={role} onSelect={setRole} />
            )}

            {step === 3 && (
              <BusinessDataStep
                role={role}
                email={email}
                password={password}
                businessName={businessName}
                phone={phone}
                address={address}
                cityZone={cityZone}
                coverageRadius={coverageRadius}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onBusinessNameChange={setBusinessName}
                onPhoneChange={setPhone}
                onAddressChange={setAddress}
                onCityZoneChange={setCityZone}
                onCoverageRadiusChange={setCoverageRadius}
              />
            )}

            {step === 4 && (
              <LocationStep
                role={role}
                cityZone={cityZone}
                coverageRadius={coverageRadius}
                deliveryZones={deliveryZones}
                onCoverageRadiusChange={setCoverageRadius}
                onDeliveryZonesChange={setDeliveryZones}
                onSelectZone={selectZone}
              />
            )}
          </div>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-8px_30px_-18px_rgba(31,41,55,0.45)] backdrop-blur md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 1 ? 'Login' : 'Atrás'}
          </button>
          {error && (
            <p className="flex-1 rounded-xl bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive text-center">
              {error}
            </p>
          )}
          <LoadingButton
            type="button"
            className="h-12 min-w-37.5 rounded-xl bg-primary px-5 text-sm font-semibold"
            onClick={handleContinue}
            loading={isLoading}
            disabled={!canContinue}
            loadingLabel="Creando cuenta"
          >
            {step === 1 ? 'Crear cuenta' : step === 4 ? 'Finalizar' : 'Continuar'}
            <ArrowRight className="h-4 w-4" />
          </LoadingButton>
        </div>
      </footer>
    </div>
  )
}

function DesktopStepper({ currentStep }: { currentStep: OnboardingStep }) {
  return (
    <div className="relative flex items-start justify-between">
      <div className="absolute left-0 top-4 h-px w-full bg-white/15" />
      <div
        className="absolute left-0 top-4 h-px bg-primary transition-all duration-300 ease-out"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      />
      {steps.map((item) => {
        const isDone = item.number < currentStep
        const isActive = item.number === currentStep
        return (
          <div key={item.number} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all ${
                isDone
                  ? 'bg-primary text-primary-foreground'
                  : isActive
                    ? 'bg-white text-sidebar ring-2 ring-white ring-offset-2 ring-offset-sidebar'
                    : 'bg-white/10 text-white/55'
              }`}
            >
              {isDone ? <Check className="h-4 w-4" /> : item.number}
            </div>
            <span className={`text-xs font-medium ${isActive ? 'text-white' : 'text-white/55'}`}>
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function WelcomeStep() {
  return (
    <div className="grid gap-8 md:grid-cols-[1fr_360px] md:items-center">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground md:text-3xl">
          Empezá a operar con proveedores y comercios en minutos
        </h2>
      </div>

      <div className="rounded-2xl border border-border bg-muted/50 p-5">
        <div className="space-y-4">
          <FeatureRow icon={Store} title="Comercios" text="Buscan proveedores, arman pedidos y siguen el estado." />
          <FeatureRow icon={Truck} title="Distribuidoras" text="Cargan productos, reciben pedidos y gestionan entregas." />
        </div>
        <Link href="/login" className="mt-5 block text-center text-sm font-semibold text-primary hover:underline">
          Ya tengo cuenta
        </Link>
      </div>
    </div>
  )
}

function RoleStep({ role, onSelect }: { role: UserRole | null; onSelect: (role: UserRole) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <RoleCard
        active={role === 'comercio'}
        icon={Store}
        title="Comercio"
        text="Quiero comprar productos para mi negocio"
        detail="Kioscos, almacenes, minimercados y tiendas de barrio."
        onClick={() => onSelect('comercio')}
      />
      <RoleCard
        active={role === 'distribuidora'}
        icon={Truck}
        title="Distribuidora"
        text="Quiero vender y gestionar pedidos"
        detail="Mayoristas, fabricantes y proveedores con reparto local."
        onClick={() => onSelect('distribuidora')}
      />
    </div>
  )
}

function RoleCard({
  active,
  icon: Icon,
  title,
  text,
  detail,
  onClick,
}: {
  active: boolean
  icon: typeof Store
  title: string
  text: string
  detail: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative rounded-2xl border p-5 text-left transition-all duration-200 ${
        active
          ? 'border-primary bg-accent shadow-[0_16px_36px_-24px_rgba(11,26,69,0.8)]'
          : 'border-border bg-card hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_36px_-28px_rgba(31,41,55,0.45)]'
      }`}
    >
      <div className="mb-5 flex items-start justify-between">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-primary'}`}>
          <Icon className="h-7 w-7" />
        </div>
        <div className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${active ? 'scale-100 border-primary bg-primary text-primary-foreground opacity-100' : 'scale-90 border-border opacity-0'}`}>
          <Check className="h-4 w-4" />
        </div>
      </div>
      <h3 className="font-heading text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-base font-medium text-foreground">{text}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p>
    </button>
  )
}

function BusinessDataStep({
  role,
  email,
  password,
  businessName,
  phone,
  address,
  cityZone,
  coverageRadius,
  onEmailChange,
  onPasswordChange,
  onBusinessNameChange,
  onPhoneChange,
  onAddressChange,
  onCityZoneChange,
  onCoverageRadiusChange,
}: {
  role: UserRole | null
  email: string
  password: string
  businessName: string
  phone: string
  address: string
  cityZone: string
  coverageRadius: string
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onBusinessNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onAddressChange: (value: string) => void
  onCityZoneChange: (value: string) => void
  onCoverageRadiusChange: (value: string) => void
}) {
  const isDistributor = role === 'distribuidora'

  return (
    <div>
      <div className="mb-6 border-b border-border pb-4">
        <h2 className="font-heading text-xl font-semibold text-foreground">Datos básicos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {isDistributor ? 'Información inicial de la empresa proveedora.' : 'Información inicial del punto de venta.'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Credentials */}
        <FormField icon={Mail} label="Email">
          <Input
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="tu@email.com"
            required
            className="h-12 bg-background pl-11"
          />
        </FormField>

        <FormField icon={KeyRound} label="Contraseña">
          <Input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            className="h-12 bg-background pl-11"
          />
        </FormField>

        {/* Business info */}
        <FormField icon={isDistributor ? Building2 : Store} label={isDistributor ? 'Nombre de la empresa' : 'Nombre del comercio'}>
          <Input
            value={businessName}
            onChange={(event) => onBusinessNameChange(event.target.value)}
            placeholder={isDistributor ? 'Ej: Bebidas del Sur' : 'Ej: Almacén Don Pedro'}
            className="h-12 bg-background pl-11"
          />
        </FormField>

        <FormField icon={Phone} label="Teléfono">
          <Input
            value={phone}
            onChange={(event) => onPhoneChange(event.target.value)}
            placeholder="+54 11 1234-5678"
            className="h-12 bg-background pl-11"
          />
        </FormField>

        <FormField icon={MapPin} label="Dirección">
          <Input
            value={address}
            onChange={(event) => onAddressChange(event.target.value)}
            placeholder="Calle y número"
            className="h-12 bg-background pl-11"
          />
        </FormField>

        <FormField icon={isDistributor ? Route : MapPin} label={isDistributor ? 'Zona de cobertura inicial' : 'Ciudad / zona'}>
          <Input
            value={isDistributor ? coverageRadius : cityZone}
            onChange={(event) => isDistributor ? onCoverageRadiusChange(event.target.value) : onCityZoneChange(event.target.value)}
            placeholder={isDistributor ? 'Ej: 15 km' : 'Ej: Avellaneda, Centro'}
            className="h-12 bg-background pl-11"
          />
        </FormField>
      </div>
    </div>
  )
}

function LocationStep({
  role,
  cityZone,
  coverageRadius,
  deliveryZones,
  onCoverageRadiusChange,
  onDeliveryZonesChange,
  onSelectZone,
}: {
  role: UserRole | null
  cityZone: string
  coverageRadius: string
  deliveryZones: string
  onCoverageRadiusChange: (value: string) => void
  onDeliveryZonesChange: (value: string) => void
  onSelectZone: (zone: string) => void
}) {
  const isDistributor = role === 'distribuidora'
  const selectedZones = deliveryZones.split(',').map(item => item.trim()).filter(Boolean)

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-6 border-b border-border pb-4">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {isDistributor ? 'Configurá tu reparto' : 'Confirmá tu ubicación'}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDistributor ? 'Estos datos ayudan a mostrarte a los comercios correctos.' : 'Esto ayuda a ordenar proveedores cercanos.'}
          </p>
        </div>

        <div className="space-y-4">
          {isDistributor ? (
            <>
              <FormField icon={Route} label="Radio de entrega">
                <Input
                  value={coverageRadius}
                  onChange={(event) => onCoverageRadiusChange(event.target.value)}
                  placeholder="Ej: 20 km"
                  className="h-12 bg-background pl-11"
                />
              </FormField>
              <FormField icon={MapPin} label="Zonas donde reparte">
                <Input
                  value={deliveryZones}
                  onChange={(event) => onDeliveryZonesChange(event.target.value)}
                  placeholder="Ej: Quilmes, Avellaneda, Lanús"
                  className="h-12 bg-background pl-11"
                />
              </FormField>
            </>
          ) : (
            <FormField icon={MapPin} label="Ubicación principal">
              <Input value={cityZone} readOnly className="h-12 bg-background pl-11" />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {zones.map((zone) => {
              const selected = isDistributor ? selectedZones.includes(zone) : cityZone.includes(zone)
              return (
                <button
                  type="button"
                  key={zone}
                  onClick={() => onSelectZone(zone)}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition-all ${
                    selected
                      ? 'border-primary bg-accent text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {zone}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {isDistributor ? <Truck className="h-6 w-6" /> : <Store className="h-6 w-6" />}
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {isDistributor ? 'Tus zonas visibles' : 'Proveedores cerca'}
        </h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isDistributor
            ? `Los comercios dentro de ${coverageRadius || 'tu radio'} van a poder encontrar tus productos.`
            : 'Al finalizar, vas a entrar al home de Comercio para ver distribuidoras cercanas.'}
        </p>
        <div className="mt-5 rounded-xl bg-card p-4 text-sm text-muted-foreground">
          {isDistributor ? deliveryZones || 'Sin zonas seleccionadas' : cityZone || 'Ubicación pendiente'}
        </div>
      </div>
    </div>
  )
}

function FormField({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Store
  label: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  )
}

function FeatureRow({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Store
  title: string
  text: string
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm leading-5 text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}
