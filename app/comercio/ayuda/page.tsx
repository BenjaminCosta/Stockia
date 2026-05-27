import { ComercioInfoPage } from '@/components/comercio-info-page'

export default function ComercioAyudaPage() {
  return (
    <ComercioInfoPage
      label="Soporte"
      title="Centro de ayuda"
      subtitle="Lo esencial para resolver pedidos, cuenta y operación diaria sin salir de StockIA."
      quickLinks={[
        {
          href: '/comercio/pedidos',
          label: 'Ver mis pedidos',
          description: 'Seguí estados, revisá entregas y calificaciones desde un solo lugar.',
        },
        {
          href: '/comercio/cuenta',
          label: 'Mi cuenta',
          description: 'Actualizá datos del negocio y revisá tu historial dentro de la plataforma.',
        },
        {
          href: '/comercio/contacto',
          label: 'Contactar soporte',
          description: 'Consultanos si necesitás ayuda operativa o resolución manual.',
        },
      ]}
      meta={[
        { label: 'Cobertura', value: 'Comercios activos de StockIA' },
        { label: 'Horario de respuesta', value: 'Lunes a viernes, 9:00 a 18:00' },
        { label: 'Actualizado', value: 'Mayo 2026' },
      ]}
      callout={{
        eyebrow: 'Soporte rápido',
        title: 'Primero revisá el detalle del pedido',
        description:
          'La mayoría de los cambios de estado, cancelaciones y datos de coordinación ya están visibles en el pedido. Antes de abrir soporte, revisá esa pantalla.',
      }}
      sections={[
        {
          title: 'Qué podés resolver desde la app',
          paragraphs: [
            'StockIA ya cubre el circuito base de compra para comercio: explorar distribuidoras, sumar productos, confirmar el pedido, seguir el estado y calificar la experiencia una vez entregado.',
            'El centro de ayuda existe para acelerar incidencias de uso y dejar claro dónde vive cada tarea dentro del flujo, sin obligarte a probar pantallas a ciegas.',
          ],
          bullets: [
            'Buscar productos por categoría, ofertas o distribuidora desde Buscar y Distribuidoras.',
            'Revisar el mínimo de compra y el total acumulado antes de pasar al checkout.',
            'Cancelar un pedido desde comercio mientras siga pendiente de confirmación.',
            'Ver datos de coordinación cuando la distribuidora acepta un pedido externo.',
          ],
        },
        {
          title: 'Pedidos y entregas',
          paragraphs: [
            'Si un pedido todavía no fue confirmado por la distribuidora, podés cancelarlo desde el detalle. Cuando la distribuidora lo confirma, el timeline muestra el avance real usando los estados de Firestore.',
            'Si elegiste coordinación externa, los datos de contacto se habilitan automáticamente cuando el pedido sale de pendiente de confirmación.',
          ],
          bullets: [
            'Pendiente de confirmación: la distribuidora todavía no aceptó el pedido.',
            'Confirmado: el pedido fue aceptado y ya podés seguir la preparación.',
            'En preparación / En camino: la distribuidora ya está avanzando con la entrega.',
            'Entregado: el pedido se cerró y podés dejar una reseña.',
          ],
        },
        {
          title: 'Cuenta y acceso',
          paragraphs: [
            'Tu cuenta de comercio mantiene los datos del negocio, dirección y contacto operativo. Si necesitás recuperar acceso, el restablecimiento de contraseña ya está disponible desde login.',
            'Para cambios de datos fiscales o incidencias fuera del flujo normal, usá la página de contacto para que el equipo lo derive manualmente.',
          ],
        },
      ]}
    />
  )
}
