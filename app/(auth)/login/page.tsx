'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Boxes, Route } from 'lucide-react'
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
    <main className="min-h-screen bg-background md:flex">
      {/* Left Panel — desktop only */}
      <div
        className="auth-panel-enter hidden md:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1672552226380-486fe900b322?q=95&w=3840&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-sidebar/85" />
        <div className="absolute inset-0 opacity-[0.06]">
          <div className="absolute -left-20 top-24 h-64 w-64 rounded-full border border-white" />
          <div className="absolute right-10 top-20 h-28 w-28 rotate-12 rounded-3xl border border-white" />
          <div className="absolute left-16 bottom-24 h-px w-56 rotate-12 bg-primary" />
          <Boxes className="absolute bottom-16 left-20 h-24 w-24 text-white" />
          <Route className="absolute right-28 bottom-36 h-20 w-20 text-white" />
        </div>
        <div className="absolute left-16 top-16 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <StockiaLogo size={52} />
          <span className="font-heading text-2xl font-bold text-white">Stockia</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="font-heading text-4xl font-bold text-white mb-4 leading-tight">
            El marketplace B2B para tu negocio
          </h2>
          <p className="text-white/70 text-lg mb-8 leading-8">
            Conectamos comercios con distribuidoras de forma simple, rápida y transparente.
          </p>
        </div>

        <div className="relative z-10 border-t border-white/10 pt-8">
          <p className="text-white/60 text-sm">Operaciones B2B simples para comercios y distribuidoras</p>
        </div>
      </div>

      {/* Right Panel — form */}
      <div className="w-full md:w-1/2 flex min-h-screen flex-col md:items-center md:justify-center md:p-8 relative">
        {/* Mobile header */}
        <div
          className="relative flex h-64 w-full flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-6 text-white md:hidden"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1672552226380-486fe900b322?q=95&w=3840&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-sidebar/82" />
          <div className="absolute inset-0 opacity-[0.07]">
            <div className="absolute -left-8 top-10 h-28 w-28 rounded-full border border-white" />
            <div className="absolute right-8 top-16 h-20 w-20 rotate-12 rounded-2xl border border-white" />
            <div className="absolute bottom-12 left-1/2 h-px w-56 -translate-x-1/2 rotate-[-16deg] bg-primary" />
          </div>
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="rounded-2xl p-1">
              <StockiaLogo size={96} className="rounded-xl" />
            </div>
            <span className="font-heading text-xl font-bold text-white tracking-wide">Stockia</span>
          </div>
        </div>

        <div className="auth-form-enter w-full max-w-md -mt-10 px-4 pb-8 md:mt-0 md:px-0 md:pb-0">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-[0_18px_50px_rgba(17,24,39,0.06)] md:p-8">
            <h2 className="hidden md:block font-heading text-3xl font-bold text-foreground mb-8">
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
                  <a href="#" className="text-xs text-primary font-medium hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
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

function PremiumBullet({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/8 px-4 py-3 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" style={{ background: 'rgba(255,255,255,0.07)' }}>
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-lima/40 bg-lima/20 text-lima backdrop-blur-sm shadow-[0_0_16px_-6px_rgba(11,26,69,0.8)]">
        <ArrowRight className="h-3.5 w-3.5" />
      </span>
      <span className="leading-5 text-white/90 text-sm font-medium">{text}</span>
    </div>
  )
}
