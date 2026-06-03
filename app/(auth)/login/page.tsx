'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, ShieldCheck, Package, Clock } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { StockiaLogo } from '@/components/stockia-logo'

// Map Firebase Auth error codes to user-friendly Spanish messages
function authErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':           return 'El email no tiene un formato válido.'
    case 'auth/user-not-found':          return 'No existe una cuenta con ese email.'
    case 'auth/wrong-password':          return 'Contraseña incorrecta.'
    case 'auth/invalid-credential':      return 'Email o contraseña incorrectos.'
    case 'auth/too-many-requests':       return 'Demasiados intentos. Intentá más tarde.'
    case 'auth/user-disabled':           return 'Esta cuenta fue deshabilitada.'
    case 'auth/network-request-failed':  return 'Sin conexión. Verificá tu internet.'
    default:                             return 'Ocurrió un error. Intentá de nuevo.'
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const role = await login(email.trim(), password)
      router.push(role === 'distribuidora' ? '/distribuidora' : '/comercio')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(authErrorMessage(code))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background lg:flex">
      {/* Left Panel — desktop only */}
      <div
        className="auth-panel-enter relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#08102b] px-11 py-12 lg:flex lg:w-1/2 xl:px-14 xl:py-16"
        style={{
          backgroundImage: "url('/assets/login-image.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center right 42%',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,43,0.98)_0%,rgba(8,15,43,0.88)_31%,rgba(8,15,43,0.48)_63%,rgba(8,15,43,0.62)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,43,0.70)_0%,rgba(8,15,43,0.08)_42%,rgba(8,15,43,0.88)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_45%,rgba(255,255,255,0.08)_0%,rgba(8,15,43,0.05)_28%,rgba(8,15,43,0.56)_72%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,15,43,0.38)_0%,transparent_44%,rgba(8,15,43,0.24)_100%)]" />

        <div className="relative z-10">
          <StockiaLogo variant="white" size={46} className="h-9 w-auto" />
        </div>

        <div className="relative z-10 mb-auto mt-[13vh] max-w-[23rem] xl:mt-[12vh] xl:max-w-[26rem]">
          <h1 className="font-heading text-[2.18rem] font-bold leading-[1.1] tracking-tight text-white xl:text-[2.82rem]">
            El marketplace B2B para tu negocio
          </h1>
          <div className="my-5 h-0.75 w-12 rounded-full bg-[#C8FF00]" />
          <p className="max-w-[22rem] text-base font-medium leading-relaxed text-white/70 xl:text-[1.05rem]">
            Conectamos comercios con distribuidoras de forma simple, rápida y transparente.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 border-t border-white/[0.08] pt-7">
          {[
            { icon: ShieldCheck, title: 'Comercio verificado',    desc: 'Transacciones seguras y confiables.' },
            { icon: Package,     title: 'Catálogo inteligente',   desc: 'Encontrá productos al mejor precio.' },
            { icon: Clock,       title: 'Operaciones eficientes', desc: 'Ahorra tiempo y haz crecer tu negocio.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 px-5 first:pl-0 last:pr-0 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-white/[0.18]"
            >
              <Icon className="mt-0.5 h-8 w-8 shrink-0 text-[#C8FF00]" strokeWidth={1.7} />
              <div>
                <p className="text-sm font-bold leading-tight text-white">{title}</p>
                <p className="mt-1 text-sm font-medium leading-snug text-white/64">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — form */}
      <div className="relative flex min-h-screen w-full flex-col lg:w-1/2 lg:items-center lg:justify-center lg:bg-[linear-gradient(180deg,#ffffff_0%,#f7f8fa_100%)] lg:p-8">
        {/* Mobile header */}
        <div
          className="relative flex h-[22rem] w-full flex-col items-center justify-center overflow-hidden bg-[#08102b] px-5 pb-20 pt-8 text-white sm:h-[24rem] lg:hidden"
          style={{
            backgroundImage: "url('/assets/login-image.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center 32%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,15,43,0.60)_0%,rgba(8,15,43,0.48)_46%,rgba(8,15,43,0.86)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,rgba(255,255,255,0.08)_0%,rgba(8,15,43,0.08)_32%,rgba(8,15,43,0.58)_72%)]" />
          <div className="pointer-events-none absolute -left-10 top-22 h-30 w-30 rounded-full border border-white/[0.10]" />
          <div className="pointer-events-none absolute right-8 top-20 h-22 w-16 rounded-[45%] border border-white/[0.09] rotate-12" />
          <div className="relative z-10 flex flex-col items-center">
            <StockiaLogo size={118} className="h-[7.4rem] w-[7.4rem]" />
            <span className="mt-3 font-heading text-4xl font-bold leading-none tracking-tight text-white">
              StockIA
            </span>
          </div>
        </div>

        <div className="auth-form-enter w-full max-w-md -mt-18 px-5 pb-8 lg:mt-0 lg:px-0 lg:pb-0">
          <div className="rounded-[2rem] border border-border bg-white p-7 shadow-[0_22px_58px_rgba(8,15,43,0.10)] lg:rounded-3xl lg:p-8 lg:shadow-[0_18px_50px_rgba(17,24,39,0.06)]">
            <h2 className="mb-8 hidden font-heading text-3xl font-bold text-foreground lg:block">
              Iniciar sesión
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link href="/login/recuperar" className="text-xs text-primary font-medium hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 pr-10"
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
              </div>

              {error && (
                <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                  {error}
                </p>
              )}

              <LoadingButton
                type="submit"
                className="w-full h-13 rounded-xl text-base mt-6 transition-transform active:scale-[0.99]"
                loading={isLoading}
                loadingLabel="Iniciando sesión"
              >
                Ingresar
              </LoadingButton>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-8">
              ¿No tenés cuenta?{' '}
              <Link href="/registro" className="text-primary font-medium hover:underline">
                Registrate acá
              </Link>
            </p>
          </div>

        </div>
      </div>
    </main>
  )
}
