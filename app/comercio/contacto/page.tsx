import Link from 'next/link'
import { Mail, MessageSquareText, PhoneCall } from 'lucide-react'
import { ComercioInfoPage } from '@/components/comercio-info-page'

const contactChannels = [
  {
    title: 'Email operativo',
    description: 'Para soporte general, validaciones manuales y seguimiento de incidencias.',
    value: 'soporte@stockia.app',
    href: 'mailto:soporte@stockia.app',
    icon: Mail,
  },
  {
    title: 'WhatsApp comercial',
    description: 'Consultas rápidas sobre pedidos, coordinación o activación de cuentas.',
    value: '+54 11 3987 2400',
    href: 'https://wa.me/541139872400',
    icon: MessageSquareText,
  },
  {
    title: 'Línea de atención',
    description: 'Soporte en horario laboral para temas urgentes de operación.',
    value: '0800-555-STOCKIA',
    href: 'tel:08005557862542',
    icon: PhoneCall,
  },
]

export default function ComercioContactoPage() {
  return (
    <ComercioInfoPage
      label="Soporte"
      title="Contacto"
      subtitle="Canales directos para resolver temas de operación, acceso o seguimiento de pedidos."
      quickLinks={[
        {
          href: '/comercio/ayuda',
          label: 'Centro de ayuda',
          description: 'Guía rápida del flujo comercio y respuestas frecuentes.',
        },
        {
          href: '/comercio/pedidos',
          label: 'Ir a pedidos',
          description: 'Antes de abrir soporte, revisá si el estado ya cambió en tu historial.',
        },
      ]}
      meta={[
        { label: 'Respuesta inicial', value: 'Dentro del día hábil' },
        { label: 'Atención', value: 'Lunes a viernes de 9:00 a 18:00' },
        { label: 'Cobertura', value: 'Comercios y distribuidoras activas' },
      ]}
      callout={{
        eyebrow: 'Antes de escribirnos',
        title: 'Tené a mano el número de pedido',
        description:
          'Si tu consulta está ligada a una compra, incluir el ID del pedido acelera la validación con la distribuidora y reduce el tiempo de resolución.',
      }}
      sections={[
        {
          title: 'Cuándo conviene contactar soporte',
          paragraphs: [
            'Usá estos canales cuando el flujo normal no alcance: problemas de acceso, pedidos con datos incorrectos, cambios manuales sobre una entrega o validaciones puntuales de cuenta.',
            'Si el estado del pedido todavía está dentro del circuito esperado, primero revisá el detalle en la app. La mayor parte de la información operativa ya está visible ahí.',
          ],
          bullets: [
            'Pedido confirmado pero sin datos de coordinación visibles.',
            'Incidencias con la cuenta o recuperación de acceso.',
            'Dudas sobre términos, privacidad o funcionamiento general de la plataforma.',
          ],
        },
      ]}
    >
      <section className="grid gap-4 md:grid-cols-3">
        {contactChannels.map((channel) => {
          const Icon = channel.icon
          return (
            <Link
              key={channel.title}
              href={channel.href}
              className="rounded-3xl border border-border bg-white p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1FFD1] text-[#0B1A45]">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm font-bold text-foreground">{channel.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{channel.description}</p>
              <p className="mt-4 text-sm font-semibold text-primary">{channel.value}</p>
            </Link>
          )
        })}
      </section>
    </ComercioInfoPage>
  )
}
