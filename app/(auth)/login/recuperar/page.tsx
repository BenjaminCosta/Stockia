'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { StockiaLogo } from '@/components/stockia-logo'

function resetErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'El email no tiene un formato válido.'
    case 'auth/user-not-found':
      return 'No existe una cuenta con ese email.'
    case 'auth/missing-email':
      return 'Ingresá el email de tu cuenta.'
    case 'auth/network-request-failed':
      return 'Sin conexión. Verificá tu internet.'
    default:
      return 'No pudimos enviar el correo. Intentá de nuevo.'
  }
}

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    setSent(false)
    setIsLoading(true)

    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSent(true)
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(resetErrorMessage(code))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-10 md:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Volver a login
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <StockiaLogo size={40} />
            <span className="font-heading text-lg font-bold text-foreground">StockIA</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-white p-6 shadow-[0_18px_50px_rgba(17,24,39,0.06)] md:p-8">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Mail className="h-6 w-6" />
          </div>

          <h1 className="font-heading text-3xl font-bold text-foreground">Recuperar contraseña</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Te enviamos un correo para restablecer tu acceso a StockIA.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

            {sent && (
              <p className="rounded-xl bg-[#F1FFD1] px-4 py-3 text-sm font-medium text-[#2d4410]">
                Revisá tu casilla de correo. Si la cuenta existe, te mandamos el enlace para restablecer la contraseña.
              </p>
            )}

            {error && (
              <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <LoadingButton
              type="submit"
              className="h-12 w-full rounded-xl text-base"
              loading={isLoading}
              loadingLabel="Enviando correo"
            >
              Enviar enlace
            </LoadingButton>
          </form>

          <div className="mt-6 rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground">No llegó el correo?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Esperá unos minutos y revisá spam. Si hace falta, podés pedir otro enlace.
            </p>
            <button
              type="button"
              onClick={() => {
                setSent(false)
                setError(null)
              }}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <RefreshCw className="h-4 w-4" />
              Intentar nuevamente
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}