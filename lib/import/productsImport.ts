import * as XLSX from 'xlsx'

export interface ParsedProductRow {
  rowIndex: number
  nombre: string
  categoria: string
  marca: string
  sku: string
  descripcion: string
  precio: number | null
  stock: number | null
  unidad: string
  estado: 'active' | 'paused' | 'out_of_stock'
  errors: string[]
  hasErrors: boolean
}

// ─── Normalización ─────────────────────────────────────────────────────────────
// Minúsculas + sin tildes + solo alfanumérico. Sirve para comparar headers y valores.

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// ─── Aliases de columnas ───────────────────────────────────────────────────────
// Cualquier header que matchee (después de normalizar) se mapea al campo interno.

const ALIASES: Record<string, string[]> = {
  nombre: [
    'nombre', 'name', 'producto', 'articulo', 'item',
    'nombreprod', 'nombreproducto', 'nombrearticulo',
    'denominacion', 'tituloproducto', 'productonombre',
  ],
  categoria: [
    'categoria', 'category', 'rubro', 'tipo', 'familia',
    'grupo', 'seccion', 'linea', 'tipoarticulo', 'tipoproducto',
    'departamento', 'clasificacion',
  ],
  marca: [
    'marca', 'brand', 'fabricante', 'productor',
    'marcaprod', 'marcaproducto',
  ],
  sku: [
    'sku', 'codigo', 'cod', 'ref', 'referencia', 'code',
    'codproducto', 'codigoproducto', 'codigoarticulo',
    'codigobarra', 'barcode', 'ean', 'isbn', 'idproducto',
    'idprod', 'codigointerno',
  ],
  descripcion: [
    'descripcion', 'descripcionlarga', 'description',
    'detalle', 'detalles', 'obs', 'observacion', 'observaciones',
    'notas', 'nota', 'info', 'informacion', 'comentario',
  ],
  precio: [
    'precio', 'price', 'valor', 'importe', 'costo',
    'pvp', 'precioventa', 'preciounidad', 'preciounitario',
    'preciobase', 'preciofinal', 'costounidad',
  ],
  stock: [
    'stock', 'cantidad', 'cant', 'qty', 'quantity',
    'existencia', 'existencias', 'inventario', 'unidades',
    'disponibilidad', 'cantidaddisponible', 'cantstock',
  ],
  unidad: [
    'unidad', 'unit', 'und', 'medida', 'um',
    'unidaddemedida', 'unidadmedida', 'tipomedida',
    'presentacion', 'formato',
  ],
  activo: [
    'activo', 'active', 'habilitado', 'visible', 'publicado',
    'activado', 'enabled', 'disponible', 'activoproducto',
  ],
  estado: [
    'estado', 'status', 'estatus', 'estadoproducto',
    'estadoarticulo', 'situacion',
  ],
}

// ─── Resolución de columnas ────────────────────────────────────────────────────

/**
 * Dada la lista de headers del archivo, devuelve un mapa campo → header original.
 * El primer alias que matchee gana.
 */
function buildColumnMap(headers: string[]): Record<string, string | undefined> {
  const normalizedHeaders = headers.map(h => ({ original: h, normed: norm(h) }))
  const map: Record<string, string | undefined> = {}

  for (const [field, aliases] of Object.entries(ALIASES)) {
    const found = normalizedHeaders.find(h => aliases.includes(h.normed))
    map[field] = found?.original
  }

  return map
}

// ─── Lectura de campos ─────────────────────────────────────────────────────────

function getString(
  raw: Record<string, unknown>,
  col: string | undefined,
): string {
  if (!col) return ''
  const val = raw[col]
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

function parseFlexNumber(s: string): number | null {
  const hasComma = s.includes(',')
  const hasDot   = s.includes('.')

  let cleaned: string
  if (hasComma && hasDot) {
    // Ambos separadores → el que viene ÚLTIMO es el decimal
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // Ej: "1.500,50" → quitar puntos, cambiar coma
      cleaned = s.replace(/\./g, '').replace(',', '.')
    } else {
      // Ej: "1,500.50" → quitar comas
      cleaned = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    // Solo comas → si la parte decimal tiene ≤2 dígitos, es separador decimal
    const parts = s.split(',')
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = s.replace(',', '.')       // "1500,50" → "1500.50"
    } else {
      cleaned = s.replace(/,/g, '')       // "1,500,000" → miles
    }
  } else if (hasDot) {
    // Solo puntos → si solo hay uno y ≤2 dígitos decimales, es separador decimal
    const parts = s.split('.')
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = s                         // "1500.50" → ya está bien
    } else {
      cleaned = s.replace(/\./g, '')      // "1.500" o "1.500.000" → miles
    }
  } else {
    cleaned = s
  }

  const n = Number(cleaned)
  return isNaN(n) ? null : n
}

function getNumber(
  raw: Record<string, unknown>,
  col: string | undefined,
): number | null {
  if (!col) return null
  const val = raw[col]
  if (val === null || val === undefined || val === '') return null
  // Con raw:true los números de Excel/CSV ya llegan como JS number
  if (typeof val === 'number') return isNaN(val) ? null : val
  // Fallback string: eliminar símbolos de moneda y espacios, luego parsear flexible
  const s = String(val).replace(/[^0-9.,\-]/g, '').trim()
  if (!s) return null
  return parseFlexNumber(s)
}

// ─── Resolución de estado ──────────────────────────────────────────────────────

function resolveEstado(
  activoRaw: string,
  estadoRaw: string,
  stock: number | null,
): 'active' | 'paused' | 'out_of_stock' {
  // Columna "Activo" (booleana: SI/NO, TRUE/FALSE, 1/0)
  if (activoRaw) {
    const n = norm(activoRaw)
    const esActivo = ['si', 's', '1', 'true', 'verdadero', 'yes', 'y', 'x'].includes(n)
    const esInactivo = ['no', 'n', '0', 'false', 'falso'].includes(n)
    if (esActivo) return 'active'
    if (esInactivo) return 'paused'
  }

  // Columna "Estado" (texto)
  if (estadoRaw) {
    const n = norm(estadoRaw)
    if (['active', 'activo', 'activa', 'habilitado', 'si', '1'].includes(n)) return 'active'
    if (['paused', 'pausado', 'pausada', 'inactivo', 'inactiva',
         'inactive', 'deshabilitado', 'no', '0'].includes(n)) return 'paused'
    if (['outofstock', 'sinstock', 'agotado', 'agotada',
         'out_of_stock', 'sin stock'].includes(n)) return 'out_of_stock'
  }

  // Fallback: sin stock si stock === 0, si no activo
  if (stock === 0) return 'out_of_stock'
  return 'active'
}

// ─── Parser principal ──────────────────────────────────────────────────────────

export function parseProductsFile(
  file: File,
): Promise<{ rows: ParsedProductRow[]; totalErrors: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          // raw: true (default) → números de Excel/CSV llegan como JS number directamente
        })

        if (rawRows.length === 0) {
          resolve({ rows: [], totalErrors: 0 })
          return
        }

        // Construir mapa de columnas UNA sola vez usando los headers de la primera fila
        const headers = Object.keys(rawRows[0])
        const colMap = buildColumnMap(headers)

        const rows: ParsedProductRow[] = rawRows.map((raw, i) => {
          const nombre     = getString(raw, colMap.nombre)
          const categoria  = getString(raw, colMap.categoria)
          const marca      = getString(raw, colMap.marca)
          const sku        = getString(raw, colMap.sku)
          const descripcion = getString(raw, colMap.descripcion)
          const unidad     = getString(raw, colMap.unidad)
          const activoRaw  = getString(raw, colMap.activo)
          const estadoRaw  = getString(raw, colMap.estado)

          const precio = getNumber(raw, colMap.precio)
          const stock  = getNumber(raw, colMap.stock)

          const estado = resolveEstado(activoRaw, estadoRaw, stock)

          const errors: string[] = []
          if (!nombre)                              errors.push('Nombre requerido')
          if (!categoria)                           errors.push('Categoría requerida')
          if (precio === null || isNaN(precio))     errors.push('Precio inválido')
          else if (precio < 0)                      errors.push('Precio debe ser ≥ 0')
          if (stock === null || isNaN(stock))       errors.push('Stock inválido')
          else if (stock < 0)                       errors.push('Stock debe ser ≥ 0')

          return {
            rowIndex: i + 2,
            nombre,
            categoria,
            marca,
            sku,
            descripcion,
            precio,
            stock,
            unidad,
            estado,
            errors,
            hasErrors: errors.length > 0,
          }
        })

        resolve({ rows, totalErrors: rows.filter((r) => r.hasErrors).length })
      } catch (err) {
        reject(err)
      }
    }

    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}
