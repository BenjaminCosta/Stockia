import { ComercioInfoPage } from '@/components/comercio-info-page'

export default function ComercioComoFuncionaPage() {
  return (
    <ComercioInfoPage
      label="Producto"
      title="Cómo funciona"
      subtitle="El circuito completo de compra para un comercio: descubrir, pedir, coordinar y volver a comprar."
      quickLinks={[
        {
          href: '/comercio/distribuidoras',
          label: 'Explorar distribuidoras',
          description: 'Entrá directo a los proveedores activos y sus catálogos.',
        },
        {
          href: '/comercio/buscar',
          label: 'Buscar productos',
          description: 'Filtrá por categoría, oferta o necesidad puntual del negocio.',
        },
        {
          href: '/comercio/pedidos',
          label: 'Seguir mis pedidos',
          description: 'Verificá confirmaciones, preparación, entrega y cierre.',
        },
      ]}
      meta={[
        { label: 'Pensado para', value: 'Compra mayorista desde móvil' },
        { label: 'Cobro plataforma', value: '1.5% sobre pedidos entregados' },
        { label: 'Modelo', value: 'Marketplace B2B entre comercios y distribuidoras' },
      ]}
      callout={{
        eyebrow: 'Flujo comercio',
        title: 'Menos WhatsApp, más trazabilidad',
        description:
          'La idea del producto es reemplazar pedidos dispersos por un flujo simple con catálogo, estado y cierre visibles desde la cuenta del comercio.',
      }}
      sections={[
        {
          title: '1. Descubrí oferta relevante',
          paragraphs: [
            'Desde Inicio, Buscar o Distribuidoras podés navegar categorías, promociones y catálogos completos. La interfaz está pensada para que el comercio llegue rápido al producto correcto y no pierda tiempo en exploración inútil.',
          ],
          bullets: [
            'Buscar por categoría o por rubro del producto.',
            'Entrar al catálogo de una distribuidora y filtrar dentro de esa misma vista.',
            'Guardar productos en wishlist para volver después.',
          ],
        },
        {
          title: '2. Armá el pedido y confirmalo',
          paragraphs: [
            'El carrito mantiene un único proveedor activo por vez. Cuando cambiás de distribuidora, la app te pide confirmación antes de reemplazar el contenido actual.',
            'En checkout podés elegir pago coordinado con distribuidora o el flujo de Mercado Pago cuando esté totalmente integrado.',
          ],
        },
        {
          title: '3. Seguimiento y cierre',
          paragraphs: [
            'Una vez enviado, el pedido recorre estados operativos claros. El detalle ya usa los estados reales de Firestore para mostrar avance consistente y, si aplica, habilitar datos de coordinación.',
            'Cuando el pedido se entrega, se abre la posibilidad de calificar a la distribuidora y dejar feedback del servicio.',
          ],
        },
      ]}
    />
  )
}
