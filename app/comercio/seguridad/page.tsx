'use client'

import { useState } from 'react'
import Link from 'next/link'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { sendPasswordResetEmail } from 'firebase/auth'
import { ComercioInfoPage } from '@/components/comercio-info-page'
import { LoadingButton } from '@/components/ui/LoadingButton'
import { useApp } from '@/lib/app-context'
import { auth } from '@/lib/firebase/client'
import type { Comercio } from '@/lib/types'

function resetErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'El email de la cuenta no tiene un formato válido.'
    case 'auth/user-not-found':
      return 'No encontramos una cuenta activa para este comercio.'
    case 'auth/network-request-failed':
      return 'Sin conexión. Verificá tu internet.'
    default:
      return 'No pudimos enviar el enlace. Intentá de nuevo.'
  }
}

export default function ComercioSeguridadPage() {
  const { currentUser } = useApp()
  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleReset = async () => {
    if (!comercio?.email) return

    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      await sendPasswordResetEmail(auth, comercio.email)
      setMessage('Te enviamos un correo para restablecer la contraseña de esta cuenta.')
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ''
      setError(resetErrorMessage(code))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <ComercioInfoPage
      label="Cuenta"
      title="Seguridad"
      subtitle="Gestioná acceso, recuperación de contraseña y recomendaciones básicas para esta cuenta comercio."
      quickLinks={[
        {
          href: '/comercio/cuenta',
          label: 'Volver a perfil',
          description: 'Revisá o editá los datos principales del negocio.',
        },
        {
          href: '/comercio/contacto',
          label: 'Contactar soporte',
          description: 'Si necesitás ayuda manual con acceso o validación.',
        },
      ]}
      meta={[
        { label: 'Email activo', value: comercio?.email || 'Sin email disponible' },
        { label: 'Canal de recuperación', value: 'Firebase Auth por correo' },
        { label: 'Estado', value: 'Cuenta autenticada' },
      ]}
      callout={{
        eyebrow: 'Acceso seguro',
        title: 'Usá recuperación por correo para no salir del flujo comercio',
        description:
          'Las rutas de login están reservadas para usuarios no autenticados. Desde esta pantalla podés disparar el restablecimiento sin romper la sesión actual.',
      }}
      sections={[
        {
          title: 'Buenas prácticas',
          paragraphs: [
            'Mantené actualizado el email del comercio y asegurate de que siga siendo accesible por alguien responsable de la operación. Ese correo es la vía principal de recuperación de acceso.',
            'Si sospechás que alguien perdió control sobre la cuenta o necesitás validar cambios sensibles, usá también el canal de contacto para dejar trazabilidad manual.',
          ],
          bullets: [
            'Verificá que el email del comercio siga vigente.',
            'Usá recuperación por correo antes de pedir intervención manual.',
            'Para incidencias operativas sensibles, sumá el ID del pedido al contacto con soporte.',
          ],
        },
      ]}
    >
      <section className="rounded-3xl border border-border bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1FFD1] text-[#0B1A45]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 font-heading text-2xl font-bold text-foreground">Restablecer contraseña</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Vamos a enviar el enlace de recuperación al email asociado a esta cuenta comercio.
            </p>
            <div className="mt-4 rounded-2xl border border-border bg-[#F7F8FA] px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Email de acceso</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {comercio?.email || 'No disponible'}
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-border bg-[#F7F8FA] p-5">
            <p className="text-sm font-semibold text-foreground">Enviar enlace</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Recibís un mail con instrucciones para actualizar tu contraseña.
            </p>

            {message && (
              <p className="mt-4 rounded-xl bg-[#F1FFD1] px-4 py-3 text-sm font-medium text-[#2d4410]">
                {message}
              </p>
            )}

            {error && (
              <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {error}
              </p>
            )}

            <LoadingButton
              type="button"
              onClick={handleReset}
              className="mt-4 h-12 w-full rounded-xl text-base"
              loading={isLoading}
              loadingLabel="Enviando enlace"
              disabled={!comercio?.email}
            >
              <KeyRound className="mr-2 h-4 w-4" />
              Restablecer contraseña
            </LoadingButton>
          </div>
        </div>
      </section>
    </ComercioInfoPage>
  )
}
