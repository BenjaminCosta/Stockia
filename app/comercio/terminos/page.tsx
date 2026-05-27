import { ComercioInfoPage } from '@/components/comercio-info-page'

export default function ComercioTerminosPage() {
  return (
    <ComercioInfoPage
      label="Legal"
      title="Términos de uso"
      subtitle="Condiciones operativas básicas para comprar dentro de StockIA como comercio."
      quickLinks={[
        {
          href: '/comercio/privacidad',
          label: 'Política de privacidad',
          description: 'Cómo tratamos los datos que pasan por la plataforma.',
        },
        {
          href: '/comercio/como-funciona',
          label: 'Cómo funciona StockIA',
          description: 'Resumen del circuito de compra y entrega para comercios.',
        },
      ]}
      meta={[
        { label: 'Versión', value: '1.0' },
        { label: 'Vigencia', value: 'Mayo 2026' },
        { label: 'Jurisdicción', value: 'Argentina' },
      ]}
      callout={{
        eyebrow: 'Importante',
        title: 'La orden se considera enviada cuando confirmás el checkout',
        description:
          'Desde ese momento el pedido queda registrado en StockIA y su tratamiento depende del estado que marque la distribuidora o de una cancelación válida desde comercio antes de la confirmación.',
      }}
      sections={[
        {
          title: 'Uso de la plataforma',
          paragraphs: [
            'StockIA conecta comercios con distribuidoras para gestionar pedidos mayoristas desde una interfaz unificada. El uso de la cuenta supone que los datos del negocio cargados por el comercio son correctos y están actualizados.',
            'Cada comercio es responsable por la veracidad de su dirección, teléfono de recepción y cualquier dato operativo usado para coordinar entregas o pagos externos.',
          ],
        },
        {
          title: 'Pedidos, estados y cancelaciones',
          paragraphs: [
            'Una vez enviado el pedido, la distribuidora puede confirmarlo, prepararlo, marcarlo como en camino o entregarlo. Mientras permanezca pendiente de confirmación, el comercio puede cancelarlo desde la aplicación.',
            'Cuando la orden deja de estar pendiente, la coordinación pasa a depender del estado operativo registrado y de la comunicación entre las partes dentro o fuera del flujo de pago.',
          ],
          bullets: [
            'Los tiempos de entrega y mínimos de compra dependen de cada distribuidora.',
            'Los datos de coordinación externa se habilitan cuando la distribuidora confirma el pedido.',
            'Las reseñas se habilitan sólo al finalizar una compra entregada.',
          ],
        },
        {
          title: 'Responsabilidades y límites',
          paragraphs: [
            'StockIA actúa como plataforma de intermediación operativa entre comercios y distribuidoras. Las condiciones comerciales específicas, la disponibilidad real de stock y la logística final pueden depender del proveedor seleccionado.',
            'La plataforma puede registrar estados, datos de pedido y métricas operativas para auditoría y mejora del servicio.',
          ],
        },
      ]}
    />
  )
}
