import { ComercioInfoPage } from '@/components/comercio-info-page'

export default function ComercioConfiguracionPage() {
  return (
    <ComercioInfoPage
      label="Cuenta"
      title="Configuración"
      subtitle="Accesos rápidos para gestionar actividad, soporte y documentos de la cuenta comercio."
      quickLinks={[
        {
          href: '/comercio/notificaciones',
          label: 'Notificaciones',
          description: 'Actividad reciente, cambios de estado y seguimiento de pedidos.',
        },
        {
          href: '/comercio/privacidad',
          label: 'Privacidad',
          description: 'Cómo se tratan los datos del comercio en la plataforma.',
        },
        {
          href: '/comercio/terminos',
          label: 'Términos',
          description: 'Condiciones básicas de uso y operación dentro de StockIA.',
        },
      ]}
      meta={[
        { label: 'Perfil', value: 'Cuenta comercio' },
        { label: 'Foco', value: 'Preferencias y soporte operativo' },
        { label: 'Actualizado', value: 'Mayo 2026' },
      ]}
      callout={{
        eyebrow: 'Configuración útil',
        title: 'Centralizamos accesos en vez de multiplicar toggles vacíos',
        description:
          'La idea de esta pantalla es agrupar destinos reales del producto: actividad, ayuda, privacidad y términos, en vez de mostrar controles que todavía no tengan efecto en producción.',
      }}
      sections={[
        {
          title: 'Qué podés gestionar desde acá',
          paragraphs: [
            'Esta pantalla reúne accesos concretos para la cuenta comercio. En vez de prometer configuraciones sin backend real, concentra los destinos que hoy sí tienen comportamiento útil dentro del producto.',
            'Si más adelante se habilitan preferencias persistentes, este es el lugar natural para agregarlas sin romper la navegación actual.',
          ],
          bullets: [
            'Revisar actividad reciente desde Notificaciones.',
            'Consultar ayuda operativa o canales de contacto.',
            'Ver documentos legales y tratamiento de datos.',
          ],
        },
      ]}
    />
  )
}
