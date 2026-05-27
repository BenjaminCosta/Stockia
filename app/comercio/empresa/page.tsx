import { ComercioInfoPage } from '@/components/comercio-info-page'

export default function ComercioEmpresaPage() {
  return (
    <ComercioInfoPage
      label="StockIA"
      title="Empresa"
      subtitle="Qué problema resuelve StockIA y cómo pensamos la operación entre comercios y distribuidoras."
      quickLinks={[
        {
          href: '/comercio/como-funciona',
          label: 'Ver cómo funciona',
          description: 'Recorrido completo del flujo de compra para comercio.',
        },
        {
          href: '/comercio/contacto',
          label: 'Hablar con StockIA',
          description: 'Canales para soporte, activación o consultas institucionales.',
        },
      ]}
      meta={[
        { label: 'Origen', value: 'Argentina' },
        { label: 'Enfoque', value: 'Abastecimiento B2B local' },
        { label: 'Producto', value: 'Marketplace operativo para reposición' },
      ]}
      callout={{
        eyebrow: 'Propósito',
        title: 'Digitalizar una cadena que todavía depende demasiado de mensajes y llamadas',
        description:
          'StockIA busca que el comercio repita compras con menos fricción y que la distribuidora tenga visibilidad real sobre pedidos, catálogo y cumplimiento.',
      }}
      sections={[
        {
          title: 'Qué resolvemos',
          paragraphs: [
            'El abastecimiento mayorista de proximidad suele estar fragmentado: catálogos desactualizados, pedidos por WhatsApp, poca trazabilidad y escasa visibilidad de estado. StockIA ordena ese circuito con una interfaz simple y estados claros.',
            'La plataforma prioriza velocidad para el comercio y control para la distribuidora, sin empujar una experiencia de marketplace masivo o promocional.',
          ],
        },
        {
          title: 'Cómo pensamos el producto',
          paragraphs: [
            'La identidad de StockIA es herramienta antes que vitrina. Por eso la experiencia pone foco en información concreta: mínimo de compra, stock, tiempo estimado, seguimiento y cierre de pedido.',
            'El objetivo es que la relación comercial exista dentro de un marco digital más ordenado, sin quitar flexibilidad donde todavía se necesita coordinación humana.',
          ],
          bullets: [
            'Mobile-first para el comprador.',
            'Visibilidad operativa para quien vende.',
            'Diseño sobrio, denso y confiable.',
          ],
        },
        {
          title: 'Cobertura y crecimiento',
          paragraphs: [
            'El producto está planteado para operar por zonas y crecer con foco regional, priorizando densidad de oferta y repetición de uso antes que expansión superficial.',
            'Eso permite construir una experiencia más confiable para comercios de proximidad y distribuidoras que necesitan una operación clara y repetible.',
          ],
        },
      ]}
    />
  )
}
