import type { Order } from '@/lib/types'
import type { FirestoreCommerce } from '@/lib/data/users.service'
import type { Distribuidora } from '@/lib/types'

const STATUS_LABELS: Record<string, string> = {
  pending_confirmation:       'Pendiente de confirmación',
  confirmed:                  'Confirmado',
  preparing:                  'En preparación',
  ready_or_on_the_way:        'En camino',
  delivered:                  'Entregado',
  delivered_with_adjustments: 'Entregado con ajustes',
  cancelled:                  'Cancelado',
  not_delivered:              'No entregado',
}

function formatARS(n: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(n)
}

function val(v: string | null | undefined, fallback = 'No informado'): string {
  return v?.trim() || fallback
}

export function printRemito(
  order: Order,
  comercio: (FirestoreCommerce & { id: string }) | null,
  distribuidora: Distribuidora | null,
): void {
  const date = new Date(order.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const statusLabel =
    STATUS_LABELS[order.firestoreStatus ?? ''] ??
    STATUS_LABELS[order.status] ??
    order.firestoreStatus ??
    order.status

  const productRows = order.items
    .map((item, i) => {
      const rowBg = i % 2 === 0 ? '#ffffff' : '#f9fafb'
      const isCancelled = item.itemStatus === 'cancelled' || item.itemStatus === 'not_delivered' || item.itemStatus === 'rejected_by_commerce'
      const displayQty = item.deliveredQuantity ?? item.confirmedQuantity ?? item.quantity
      const displaySubtotal = item.finalSubtotal ?? (item.unitPrice * displayQty)
      const nameStyle = isCancelled ? 'color:#9ca3af;text-decoration:line-through' : 'color:#111827'
      const qtyStyle = isCancelled ? 'color:#9ca3af' : 'color:#111827'
      const subtotalStyle = isCancelled ? 'color:#9ca3af;text-decoration:line-through' : 'color:#111827'
      const cancelledBadge = isCancelled ? `<br><span style="font-size:10px;color:#ef4444;font-weight:700;text-transform:uppercase">Cancelado</span>` : ''
      return `
        <tr style="background:${rowBg}">
          <td style="padding:9px 10px;font-size:11px;color:#6b7280;border-bottom:1px solid #e5e7eb;">${item.productId.slice(0, 8).toUpperCase()}</td>
          <td style="padding:9px 10px;font-size:12px;border-bottom:1px solid #e5e7eb;${nameStyle}">${item.productName}${cancelledBadge}</td>
          <td style="padding:9px 10px;font-size:12px;text-align:center;border-bottom:1px solid #e5e7eb;${qtyStyle}">${displayQty}</td>
          <td style="padding:9px 10px;font-size:11px;text-align:center;color:#6b7280;border-bottom:1px solid #e5e7eb;">—</td>
          <td style="padding:9px 10px;font-size:12px;text-align:right;border-bottom:1px solid #e5e7eb;${qtyStyle}">${formatARS(item.unitPrice)}</td>
          <td style="padding:9px 10px;font-size:12px;font-weight:600;text-align:right;border-bottom:1px solid #e5e7eb;${subtotalStyle}">${formatARS(displaySubtotal)}</td>
        </tr>`
    })
    .join('')

  const comercioAddress = val(comercio?.address)
  const comercioCity = comercio?.city ? `, ${comercio.city}` : ''
  const comercioProvince = comercio?.province ? `, ${comercio.province}` : ''
  const comercioPhone = val(comercio?.phone)
  const comercioName = val(comercio?.businessName ?? order.comercioName)

  const distName = val(distribuidora?.companyName ?? order.distribuidoraName)
  const distAddress = val(distribuidora?.address)
  const distPhone = val(distribuidora?.phone)
  const distCuit = val(distribuidora?.cuit)
  const distInitials = distName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const distMetaParts = [
    distCuit !== 'No informado' ? `CUIT ${distCuit}` : null,
    distAddress !== 'No informado' ? distAddress : null,
    distPhone !== 'No informado' ? `Tel. ${distPhone}` : null,
  ].filter(Boolean)
  const distMeta = distMetaParts.join(' · ')

  const itemFinalTotal = order.items.reduce((sum, item) => {
    const qty = item.deliveredQuantity ?? item.confirmedQuantity ?? item.quantity
    return sum + (item.finalSubtotal ?? item.unitPrice * qty)
  }, 0)
  const finalTotal = order.deliveredTotal ?? order.confirmedTotal ?? itemFinalTotal
  const originalTotal = order.originalTotal ?? order.total
  const hasAdjustments = order.hasItemAdjustments && originalTotal != null && originalTotal !== finalTotal
  const isDelivered = order.firestoreStatus === 'delivered' || order.firestoreStatus === 'delivered_with_adjustments' || order.status === 'entregado' || order.status === 'entregado_con_ajustes'
  const finalTotalLabel = hasAdjustments
    ? isDelivered ? 'Total entregado' : 'Total aprobado'
    : 'Total'
  const observations = val(order.cancellationReason, '')
  const logoUrl = `${window.location.origin}/iso-stockia.png`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Remito ${order.orderNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #111827;
      background: #fff;
      font-size: 13px;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      padding: 36px 40px;
    }

    /* ── Header ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
      padding-bottom: 20px;
      border-bottom: 2px solid #0b1a45;
    }

    /* Distributor identity — protagonist */
    .dist-identity { display: flex; align-items: flex-start; gap: 14px; }
    .dist-avatar {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: #0b1a45;
      color: #c8ff00;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
      flex-shrink: 0;
    }
    .dist-info { display: flex; flex-direction: column; gap: 5px; }
    .dist-name {
      font-size: 22px;
      font-weight: 800;
      color: #0b1a45;
      letter-spacing: -0.4px;
      line-height: 1.1;
    }
    .dist-meta {
      font-size: 11px;
      color: #6b7280;
      line-height: 1.4;
    }

    /* Document block — right side */
    .doc-block { text-align: right; display: flex; flex-direction: column; gap: 3px; align-items: flex-end; }
    .doc-title {
      font-size: 15px;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .doc-number {
      font-size: 20px;
      font-weight: 800;
      color: #0b1a45;
      letter-spacing: -0.4px;
    }
    .doc-date { font-size: 11px; color: #6b7280; margin-top: 2px; }
    .stockia-tag {
      margin-top: 8px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 5px;
      font-size: 10px;
      color: #d1d5db;
      font-weight: 500;
      letter-spacing: 0.08em;
    }
    .stockia-tag img {
      width: 14px;
      height: 14px;
      opacity: 0.25;
      display: block;
    }

    /* ── Disclaimer ── */
    .disclaimer {
      background: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 6px;
      padding: 8px 14px;
      font-size: 11px;
      font-weight: 600;
      color: #92400e;
      text-align: center;
      margin-bottom: 22px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* ── Status badge ── */
    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      background: #e0f2fe;
      color: #0369a1;
      border: 1px solid #bae6fd;
      margin-bottom: 22px;
    }

    /* ── Info grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .info-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px 16px;
    }
    .info-card-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #9ca3af;
      margin-bottom: 10px;
    }
    .info-row { margin-bottom: 5px; }
    .info-label { font-size: 11px; color: #6b7280; }
    .info-value { font-size: 12px; font-weight: 600; color: #111827; }

    /* ── Delivery address ── */
    .delivery-block {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 24px;
    }
    .delivery-block-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    .delivery-address {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
    }

    /* ── Products table ── */
    .products-section { margin-bottom: 20px; }
    .products-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #9ca3af;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    thead tr {
      background: #f3f4f6;
    }
    thead th {
      padding: 10px 10px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    thead th:last-child,
    thead th:nth-child(5) { text-align: right; }
    thead th:nth-child(3),
    thead th:nth-child(4) { text-align: center; }

    /* ── Totals ── */
    .totals {
      margin-left: auto;
      width: 260px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 24px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 14px;
      font-size: 12px;
      border-bottom: 1px solid #f3f4f6;
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.total-final {
      background: #0b1a45;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
    }
    .totals-label { color: #6b7280; }
    .totals-row.total-final .totals-label { color: #c8ff00; }

    /* ── Observations ── */
    .observations {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 24px;
    }
    .observations-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .observations-text { font-size: 12px; color: #374151; }

    /* ── Signature area ── */
    .signature-section {
      border-top: 1px dashed #d1d5db;
      padding-top: 20px;
      margin-top: 8px;
    }
    .signature-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #9ca3af;
      margin-bottom: 16px;
    }
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
    }
    .signature-field { text-align: center; }
    .signature-line {
      border-bottom: 1px solid #374151;
      height: 48px;
      margin-bottom: 6px;
    }
    .signature-field-label {
      font-size: 10px;
      color: #9ca3af;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* ── Footer ── */
    .footer {
      margin-top: 28px;
      padding-top: 14px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-size: 10px;
      color: #9ca3af;
    }
    .footer img {
      width: 13px;
      height: 13px;
      opacity: 0.35;
      display: block;
    }

    /* ── Print button (hidden on print) ── */
    .print-bar {
      position: fixed;
      bottom: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
    }
    .btn-print {
      background: #0b1a45;
      color: #c8ff00;
      border: none;
      border-radius: 10px;
      padding: 12px 22px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    .btn-close {
      background: #fff;
      color: #374151;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.08);
    }

    @media print {
      .print-bar { display: none !important; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .page { padding: 20px 24px; }
    }
  </style>
</head>
<body>

<div class="page">

  <!-- Header -->
  <div class="header">
    <!-- Distribuidora: protagonista -->
    <div class="dist-identity">
      <div class="dist-avatar">${distInitials}</div>
      <div class="dist-info">
        <div class="dist-name">${distName}</div>
        ${distMeta ? `<div class="dist-meta">${distMeta}</div>` : ''}
      </div>
    </div>
    <!-- Documento: info + StockIA sutil -->
    <div class="doc-block">
      <div class="doc-title">Remito de pedido</div>
      <div class="doc-number"># ${order.orderNumber}</div>
      <div class="doc-date">${date}</div>
      <div class="stockia-tag"><img src="${logoUrl}" alt="">vía StockIA</div>
    </div>
  </div>

  <!-- Disclaimer fiscal -->
  <div class="disclaimer">
    Documento no válido como factura — Solo de uso operativo interno
  </div>

  <!-- Estado -->
  <div class="status-badge">Estado: ${statusLabel}</div>

  <!-- Info distribuidora + comercio -->
  <div class="info-grid">
    <div class="info-card">
      <div class="info-card-title">Distribuidora</div>
      <div class="info-row">
        <div class="info-value">${distName}</div>
      </div>
      ${distCuit !== 'No informado' ? `<div class="info-row"><span class="info-label">CUIT: </span><span class="info-value">${distCuit}</span></div>` : ''}
      ${distAddress !== 'No informado' ? `<div class="info-row"><span class="info-label">Dirección: </span><span class="info-value">${distAddress}</span></div>` : ''}
      ${distPhone !== 'No informado' ? `<div class="info-row"><span class="info-label">Tel: </span><span class="info-value">${distPhone}</span></div>` : ''}
    </div>
    <div class="info-card">
      <div class="info-card-title">Comercio</div>
      <div class="info-row">
        <div class="info-value">${comercioName}</div>
      </div>
      ${comercio?.cuit ? `<div class="info-row"><span class="info-label">CUIT: </span><span class="info-value">${comercio.cuit}</span></div>` : ''}
      ${comercioPhone !== 'No informado' ? `<div class="info-row"><span class="info-label">Tel: </span><span class="info-value">${comercioPhone}</span></div>` : ''}
    </div>
  </div>

  <!-- Dirección de entrega -->
  <div class="delivery-block">
    <div class="delivery-block-title">Dirección de entrega</div>
    <div class="delivery-address">${comercioAddress}${comercioCity}${comercioProvince}</div>
  </div>

  <!-- Tabla de productos -->
  <div class="products-section">
    <div class="products-title">Productos del pedido</div>
    <table>
      <thead>
        <tr>
          <th style="width:88px">SKU / Ref.</th>
          <th>Producto</th>
          <th style="width:64px">Cant.</th>
          <th style="width:80px">Presentación</th>
          <th style="width:100px">P. unitario</th>
          <th style="width:110px">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${productRows}
      </tbody>
    </table>
  </div>

  <!-- Totales -->
  <div class="totals">
    ${hasAdjustments ? `
    <div class="totals-row">
      <span class="totals-label">Subtotal solicitado</span>
      <span>${formatARS(originalTotal!)}</span>
    </div>
    <div class="totals-row">
      <span class="totals-label">Ajuste</span>
      <span style="color:#ef4444">-${formatARS(originalTotal! - finalTotal)}</span>
    </div>
    ` : `
    <div class="totals-row">
      <span class="totals-label">Subtotal</span>
      <span>${formatARS(finalTotal)}</span>
    </div>
    `}
    <div class="totals-row">
      <span class="totals-label">Envío</span>
      <span style="color:#059669;font-weight:600">Gratis</span>
    </div>
    <div class="totals-row total-final">
      <span class="totals-label">${finalTotalLabel}</span>
      <span>${formatARS(finalTotal)}</span>
    </div>
  </div>

  ${
    observations
      ? `<div class="observations">
          <div class="observations-title">Observaciones</div>
          <div class="observations-text">${observations}</div>
        </div>`
      : ''
  }

  <!-- Firma recepción -->
  <div class="signature-section">
    <div class="signature-title">Recepción de mercadería</div>
    <div class="signature-grid">
      <div class="signature-field">
        <div class="signature-line"></div>
        <div class="signature-field-label">Firma</div>
      </div>
      <div class="signature-field">
        <div class="signature-line"></div>
        <div class="signature-field-label">Aclaración</div>
      </div>
      <div class="signature-field">
        <div class="signature-line"></div>
        <div class="signature-field-label">DNI</div>
      </div>
      <div class="signature-field">
        <div class="signature-line"></div>
        <div class="signature-field-label">Fecha de recepción</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <img src="${logoUrl}" alt="">
    Generado el ${new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
    a las ${new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
    &nbsp;·&nbsp; Documento operativo interno &nbsp;·&nbsp; <strong>StockIA</strong>
  </div>

</div>

<!-- Botones flotantes (solo en pantalla) -->
<div class="print-bar">
  <button class="btn-close" onclick="window.close()">Cerrar</button>
  <button class="btn-print" onclick="window.print()">Imprimir / Guardar PDF</button>
</div>

</body>
</html>`

  const win = window.open('', '_blank', 'width=860,height=960')
  if (!win) {
    alert('Activá los pop-ups del navegador para generar el remito.')
    return
  }
  win.document.write(html)
  win.document.close()
  win.focus()
}
