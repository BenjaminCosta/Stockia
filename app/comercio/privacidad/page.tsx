import { ComercioInfoPage } from '@/components/comercio-info-page'

export default function ComercioPrivacidadPage() {
  return (
    <ComercioInfoPage
      label="Legal"
      title="Privacidad"
      subtitle="Qué datos usamos para operar pedidos, proteger cuentas y mejorar la experiencia de comercio."
      quickLinks={[
        {
          href: '/comercio/terminos',
          label: 'Leer términos',
          description: 'Condiciones de uso y responsabilidad operativa dentro de StockIA.',
        },
        {
          href: '/comercio/contacto',
          label: 'Contacto',
          description: 'Canales para consultas sobre datos, soporte o incidencias.',
        },
      ]}
      meta={[
        { label: 'Última revisión', value: 'Mayo 2026' },
        { label: 'Datos principales', value: 'Cuenta, pedidos y actividad operativa' },
        { label: 'Alcance', value: 'Usuarios con rol comercio' },
      ]}
      callout={{
        eyebrow: 'Datos mínimos',
        title: 'Sólo pedimos lo necesario para comprar y entregar',
        description:
          'Nombre del negocio, contacto, ubicación y datos ligados al pedido son la base para que la distribuidora pueda aceptar, preparar y completar una compra correctamente.',
      }}
      sections={[
        {
          title: 'Qué información se registra',
          paragraphs: [
            'StockIA almacena datos de acceso, rol de usuario, información del comercio, historial de pedidos, reseñas y eventos operativos necesarios para que el marketplace funcione.',
            'También puede registrar timestamps, cambios de estado y datos de navegación internos para mejorar trazabilidad, soporte y calidad del producto.',
          ],
          bullets: [
            'Datos de cuenta: email, rol y credenciales manejadas por Firebase Auth.',
            'Datos del negocio: nombre, dirección, teléfono y ubicación operativa.',
            'Datos transaccionales: pedidos, estados, productos, montos y reseñas.',
          ],
        },
        {
          title: 'Cómo se usa la información',
          paragraphs: [
            'La información se usa para autenticar al usuario, mostrar distribuidoras compatibles, crear órdenes, habilitar datos de coordinación, moderar reseñas y resolver incidencias.',
            'No se usan datos del comercio para fines ajenos al servicio sin una base operativa o legal que lo justifique.',
          ],
        },
        {
          title: 'Control y consultas',
          paragraphs: [
            'Desde la cuenta de comercio podés actualizar tus datos operativos. Para consultas sobre tratamiento de datos o pedidos específicos, podés escribir al canal de contacto publicado en la app.',
            'Los datos ligados a pedidos ya emitidos pueden mantenerse por razones de auditoría, conciliación y soporte, aun cuando cambien los datos del perfil.',
          ],
        },
      ]}
    />
  )
}
