'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Boxes,
  Building2,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Route,
  ShieldCheck,
  Store,
  Truck,
} from 'lucide-react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { upsertUser, upsertCommerce } from '@/lib/data/users.service'
import { upsertDistributor } from '@/lib/data/distributors.service'
import { setSessionCookie } from '@/lib/cookies'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserRole } from '@/lib/types'
import { LocationSelector, LocationSelectorValue } from '@/components/location-selector'
import { isValidLocality, isValidProvince, normalizeLocationInput } from '@/lib/locations/location-utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const PRODUCT_CATEGORIES = [
  'Bebidas',
  'Snacks y golosinas',
  'Almacén',
  'Lácteos y frescos',
  'Limpieza',
  'Higiene personal',
  'Cigarrillos',
  'Congelados',
  'Panificados',
]

const COMMERCE_TYPES = [
  'Kiosco',
  'Almacén / Despensa',
  'Minimercado',
  'Supermercado',
  'Restaurante / Bar',
  'Farmacia',
  'Otro',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function registroErrorMessage(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'Ya existe una cuenta con ese email.'
    case 'auth/invalid-email':        return 'El email no tiene un formato válido.'
    case 'auth/weak-password':        return 'La contraseña debe tener al menos 6 caracteres.'
    case 'auth/network-request-failed': return 'Sin conexión. Verificá tu internet.'
    default:                          return 'Ocurrió un error. Intentá de nuevo.'
  }
}

function getPasswordStrength(password: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (password.length === 0) return { level: 0, label: '' }
  if (password.length < 6) return { level: 1, label: 'Muy corta' }
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const score = [password.length >= 8, hasUpper && hasLower, hasNumber, hasSpecial].filter(Boolean).length
  if (score <= 1) return { level: 1, label: 'Débil' }
  if (score <= 2) return { level: 2, label: 'Media' }
  return { level: 3, label: 'Fuerte' }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type OnboardingStep = 1 | 2 | 3 | 4

const steps = [
  { number: 1, label: 'Inicio' },
  { number: 2, label: 'Tipo' },
  { number: 3, label: 'Datos' },
  { number: 4, label: 'Ubicación' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RegistroPage() {
  const router = useRouter()
  const [step, setStep] = useState<OnboardingStep>(1)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Business data
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [cuit, setCuit] = useState('')
  const [businessType, setBusinessType] = useState('')       // comercio only
  const [minimumOrder, setMinimumOrder] = useState('')       // distribuidora only
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]) // distribuidora only

  // Location
  const [location, setLocation] = useState<LocationSelectorValue>({ province: '', city: '' })
  const [coverageRadius, setCoverageRadius] = useState('15')
  const [deliveryLocationDraft, setDeliveryLocationDraft] = useState<LocationSelectorValue>({ province: '', city: '' })
  const [deliveryLocationKeys, setDeliveryLocationKeys] = useState<string[]>([])
  const [deliveryLocationLabels, setDeliveryLocationLabels] = useState<Record<string, string>>({})

  const progress = `${(step / steps.length) * 100}%`

  const title =
    step === 1 ? 'Comprá y gestioná stock de forma simple'
    : step === 2 ? 'Elegí tu tipo de cuenta'
    : step === 3 ? (role === 'distribuidora' ? 'Datos de la empresa' : 'Datos del comercio')
    : role === 'distribuidora' ? 'Cobertura y categorías' : 'Ubicación del comercio'

  const description =
    step === 1 ? 'Conectá comercios locales con distribuidoras para pedir, vender y organizar operaciones B2B.'
    : step === 2 ? 'Esta selección define la navegación y las herramientas principales del prototipo.'
    : step === 3 ? 'Completá la información de acceso y los datos básicos del negocio.'
    : role === 'distribuidora' ? 'Definí las localidades de reparto y los rubros que manejás.'
    : 'Confirmá tu localidad para mostrar proveedores desde el inicio.'

  const canContinue =
    (step === 1) ||
    (step === 2 && !!role) ||
    (step === 3 &&
      email.trim().length > 0 &&
      password.length >= 6 &&
      password === confirmPassword &&
      businessName.trim().length > 0 &&
      phone.trim().length > 0 &&
      address.trim().length > 0
    ) ||
    (step === 4 &&
      isValidProvince(location.province) &&
      isValidLocality(location.province, location.city)
    )

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
      const name = businessName.trim() || email.split('@')[0]

      await upsertUser(uid, { name, email: email.trim(), role })
      const normalizedLocation = normalizeLocationInput(location)

      if (role === 'comercio') {
        await upsertCommerce(uid, {
          userId: uid,
          businessName: name,
          phone,
          address,
          ...normalizedLocation,
          status: 'active',
          ...(cuit.trim() && { cuit: cuit.trim() }),
          ...(businessType && { businessType }),
        })
      } else {
        const safeDeliveryLocationKeys = deliveryLocationKeys.length
          ? deliveryLocationKeys
          : [normalizedLocation.locationKey]
        await upsertDistributor(uid, {
          userId: uid,
          companyName: name,
          phone,
          address,
          city: normalizedLocation.city,
          citySlug: normalizedLocation.citySlug,
          province: normalizedLocation.province,
          provinceSlug: normalizedLocation.provinceSlug,
          locationKey: normalizedLocation.locationKey,
          lat: null,
          lng: null,
          location: normalizedLocation,
          coverageRadiusKm: parseFloat(coverageRadius) || 15,
          minimumOrder: parseFloat(minimumOrder) || 0,
          categories: selectedCategories,
          status: 'active',
          deliveryZones: safeDeliveryLocationKeys.map(key => deliveryLocationLabels[key] ?? key),
          deliveryLocationKeys: safeDeliveryLocationKeys,
          deliveryZoneKeys: safeDeliveryLocationKeys,
          ...(cuit.trim() && { cuit: cuit.trim() }),
        })
      }

      setSessionCookie(role)
      router.push(role === 'comercio' ? '/comercio/onboarding' : '/distribuidora/onboarding')
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

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    )
  }

  const addDeliveryLocation = () => {
    if (!isValidProvince(deliveryLocationDraft.province) || !isValidLocality(deliveryLocationDraft.province, deliveryLocationDraft.city)) return
    const normalized = normalizeLocationInput(deliveryLocationDraft)
    setDeliveryLocationKeys(prev => prev.includes(normalized.locationKey) ? prev : [...prev, normalized.locationKey])
    setDeliveryLocationLabels(prev => ({
      ...prev,
      [normalized.locationKey]: `${normalized.city}, ${normalized.province}`,
    }))
    setDeliveryLocationDraft({ province: '', city: '' })
  }

  const removeDeliveryLocation = (locationKey: string) => {
    setDeliveryLocationKeys(prev => prev.filter(key => key !== locationKey))
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
            {step === 1 && <WelcomeStep />}

            {step === 2 && <RoleStep role={role} onSelect={setRole} />}

            {step === 3 && (
              <BusinessDataStep
                role={role}
                email={email}
                password={password}
                confirmPassword={confirmPassword}
                businessName={businessName}
                phone={phone}
                address={address}
                cuit={cuit}
                businessType={businessType}
                minimumOrder={minimumOrder}
                onEmailChange={setEmail}
                onPasswordChange={setPassword}
                onConfirmPasswordChange={setConfirmPassword}
                onBusinessNameChange={setBusinessName}
                onPhoneChange={setPhone}
                onAddressChange={setAddress}
                onCuitChange={setCuit}
                onBusinessTypeChange={setBusinessType}
                onMinimumOrderChange={setMinimumOrder}
              />
            )}

            {step === 4 && (
              <LocationStep
                role={role}
                location={location}
                onLocationChange={setLocation}
                coverageRadius={coverageRadius}
                deliveryLocationDraft={deliveryLocationDraft}
                deliveryLocationKeys={deliveryLocationKeys}
                deliveryLocationLabels={deliveryLocationLabels}
                selectedCategories={selectedCategories}
                onCoverageRadiusChange={setCoverageRadius}
                onDeliveryLocationDraftChange={setDeliveryLocationDraft}
                onAddDeliveryLocation={addDeliveryLocation}
                onRemoveDeliveryLocation={removeDeliveryLocation}
                onCategoryToggle={toggleCategory}
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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
        detail="Kioscos, almacenes, minimercados y tiendas locales."
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
  active, icon: Icon, title, text, detail, onClick,
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
  email, password, confirmPassword,
  businessName, phone, address, cuit, businessType, minimumOrder,
  onEmailChange, onPasswordChange, onConfirmPasswordChange,
  onBusinessNameChange, onPhoneChange, onAddressChange,
  onCuitChange, onBusinessTypeChange, onMinimumOrderChange,
}: {
  role: UserRole | null
  email: string
  password: string
  confirmPassword: string
  businessName: string
  phone: string
  address: string
  cuit: string
  businessType: string
  minimumOrder: string
  onEmailChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onConfirmPasswordChange: (v: string) => void
  onBusinessNameChange: (v: string) => void
  onPhoneChange: (v: string) => void
  onAddressChange: (v: string) => void
  onCuitChange: (v: string) => void
  onBusinessTypeChange: (v: string) => void
  onMinimumOrderChange: (v: string) => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const isDistributor = role === 'distribuidora'
  const strength = getPasswordStrength(password)
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  const strengthColor =
    strength.level === 1 ? 'bg-red-400' :
    strength.level === 2 ? 'bg-amber-400' :
    strength.level === 3 ? 'bg-emerald-500' : 'bg-border'

  const strengthTextColor =
    strength.level === 1 ? 'text-red-500' :
    strength.level === 2 ? 'text-amber-500' :
    strength.level === 3 ? 'text-emerald-600' : ''

  return (
    <div className="space-y-8">
      {/* Section: Credenciales */}
      <div>
        <div className="mb-5 border-b border-border pb-4">
          <h2 className="font-heading text-base font-semibold text-foreground">Credenciales de acceso</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">Con este email y contraseña vas a ingresar a la plataforma.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Email */}
          <FormField icon={Mail} label="Email *">
            <Input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="tu@email.com"
              required
              className="h-12 bg-background pl-11"
            />
          </FormField>

          {/* Password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Contraseña *</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="h-12 bg-background pl-11 pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors duration-200 ${strength.level >= level ? strengthColor : 'bg-border'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strengthTextColor}`}>{strength.label}</p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Confirmar contraseña *</Label>
            <div className="relative">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                placeholder="Repetí la contraseña"
                required
                className={`h-12 bg-background pl-11 pr-10 ${passwordsMismatch ? 'border-destructive focus-visible:ring-destructive/30' : passwordsMatch ? 'border-emerald-500 focus-visible:ring-emerald-500/30' : ''}`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordsMismatch && (
              <p className="text-xs font-medium text-destructive">Las contraseñas no coinciden</p>
            )}
            {passwordsMatch && (
              <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                <Check className="h-3 w-3" /> Las contraseñas coinciden
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Section: Negocio */}
      <div>
        <div className="mb-5 border-b border-border pb-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            {isDistributor ? 'Información de la empresa' : 'Información del comercio'}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isDistributor ? 'Datos básicos de tu empresa proveedora.' : 'Datos básicos de tu punto de venta.'}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Business name */}
          <FormField icon={isDistributor ? Building2 : Store} label={isDistributor ? 'Nombre de la empresa *' : 'Nombre del comercio *'}>
            <Input
              value={businessName}
              onChange={(e) => onBusinessNameChange(e.target.value)}
              placeholder={isDistributor ? 'Ej: Bebidas del Sur' : 'Ej: Almacén Don Pedro'}
              required
              className="h-12 bg-background pl-11"
            />
          </FormField>

          {/* Phone */}
          <FormField icon={Phone} label="Teléfono *">
            <Input
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="+54 11 1234-5678"
              required
              className="h-12 bg-background pl-11"
            />
          </FormField>

          {/* Address — full width */}
          <div className="md:col-span-2">
            <FormField icon={MapPin} label="Dirección *">
              <Input
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="Calle, número y localidad"
                required
                className="h-12 bg-background pl-11"
              />
            </FormField>
          </div>

          {/* CUIT */}
          <FormField icon={CreditCard} label="CUIT (opcional)">
            <Input
              value={cuit}
              onChange={(e) => onCuitChange(e.target.value)}
              placeholder="20-12345678-9"
              className="h-12 bg-background pl-11"
            />
          </FormField>

          {/* Tipo de comercio (comercio only) / Pedido mínimo (distribuidora only) */}
          {isDistributor ? (
            <FormField icon={Banknote} label="Pedido mínimo (opcional)">
              <Input
                type="number"
                min="0"
                value={minimumOrder}
                onChange={(e) => onMinimumOrderChange(e.target.value)}
                placeholder="Ej: 5000"
                className="h-12 bg-background pl-11"
              />
            </FormField>
          ) : (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Tipo de negocio (opcional)</Label>
              <div className="flex flex-wrap gap-2">
                {COMMERCE_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onBusinessTypeChange(businessType === type ? '' : type)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium transition-all ${
                      businessType === type
                        ? 'border-primary bg-accent text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function LocationStep({
  role,
  location,
  onLocationChange,
  coverageRadius,
  deliveryLocationDraft,
  deliveryLocationKeys,
  deliveryLocationLabels,
  selectedCategories,
  onCoverageRadiusChange,
  onDeliveryLocationDraftChange,
  onAddDeliveryLocation,
  onRemoveDeliveryLocation,
  onCategoryToggle,
}: {
  role: UserRole | null
  location: LocationSelectorValue
  onLocationChange: (value: LocationSelectorValue) => void
  coverageRadius: string
  deliveryLocationDraft: LocationSelectorValue
  deliveryLocationKeys: string[]
  deliveryLocationLabels: Record<string, string>
  selectedCategories: string[]
  onCoverageRadiusChange: (v: string) => void
  onDeliveryLocationDraftChange: (value: LocationSelectorValue) => void
  onAddDeliveryLocation: () => void
  onRemoveDeliveryLocation: (locationKey: string) => void
  onCategoryToggle: (cat: string) => void
}) {
  const isDistributor = role === 'distribuidora'

  return (
    <div className="space-y-8">
      {/* Location / Coverage section */}
      <div>
        <div className="mb-5 border-b border-border pb-4">
          <h2 className="font-heading text-base font-semibold text-foreground">
            {isDistributor ? 'Configurá tu reparto' : 'Confirmá tu ubicación'}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isDistributor
              ? 'Estos datos ayudan a mostrarte a los comercios correctos.'
              : 'Esto ayuda a ordenar proveedores cercanos a tu negocio.'}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <LocationSelector
              value={location}
              onChange={onLocationChange}
              compact
            />

            {isDistributor && (
              <>
                <FormField icon={Route} label="Radio de entrega (km)">
                  <Input
                    value={coverageRadius}
                    onChange={(e) => onCoverageRadiusChange(e.target.value)}
                    placeholder="Ej: 20"
                    className="h-12 bg-background pl-11"
                  />
                </FormField>

                <div className="rounded-2xl border border-border bg-muted/30 p-4">
                  <p className="mb-3 text-sm font-semibold text-foreground">Localidades de reparto</p>
                  <LocationSelector
                    value={deliveryLocationDraft}
                    onChange={onDeliveryLocationDraftChange}
                    compact
                  />
                  <button
                    type="button"
                    onClick={onAddDeliveryLocation}
                    className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                  >
                    Agregar localidad
                  </button>

                  {deliveryLocationKeys.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {deliveryLocationKeys.map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onRemoveDeliveryLocation(key)}
                          className="rounded-full border border-primary/20 bg-accent px-3 py-1.5 text-xs font-semibold text-primary"
                          title="Quitar localidad"
                        >
                          {deliveryLocationLabels[key] ?? key} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {isDistributor ? <Truck className="h-6 w-6" /> : <Store className="h-6 w-6" />}
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">
              {isDistributor ? 'Tus localidades visibles' : 'Proveedores cerca'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isDistributor
                ? 'Los comercios de tus localidades cubiertas van a poder encontrarte.'
                : 'Al finalizar, vas a ver distribuidoras que entregan en tu localidad.'}
            </p>
            <div className="mt-4 rounded-xl bg-card p-3 text-sm text-muted-foreground">
              {isDistributor
                ? (deliveryLocationKeys.length ? deliveryLocationKeys.map(key => deliveryLocationLabels[key] ?? key).join(' · ') : 'Se usará tu localidad base si no agregás otras')
                : [location.city, location.province].filter(Boolean).join(', ') || 'Ubicación pendiente'}
            </div>
          </div>
        </div>
      </div>

      {/* Categories section — distribuidora only */}
      {isDistributor && (
        <div>
          <div className="mb-5 border-b border-border pb-4">
            <h2 className="font-heading text-base font-semibold text-foreground">Rubros que manejás</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Seleccioná las categorías de productos que distribuís. Podés cambiarlas después.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((cat) => {
              const selected = selectedCategories.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onCategoryToggle(cat)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                    selected
                      ? 'border-primary bg-accent text-primary'
                      : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground'
                  }`}
                >
                  {selected && <Check className="h-3.5 w-3.5" />}
                  {cat}
                </button>
              )
            })}
          </div>

          {selectedCategories.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {selectedCategories.length} {selectedCategories.length === 1 ? 'rubro seleccionado' : 'rubros seleccionados'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Shared UI helpers ────────────────────────────────────────────────────────

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
