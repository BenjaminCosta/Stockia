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

const VALID_ESTADOS = ['active', 'paused', 'out_of_stock']

function readField(raw: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    if (raw[key] !== undefined && raw[key] !== null) return String(raw[key]).trim()
  }
  return ''
}

export function parseProductsFile(
  file: File
): Promise<{ rows: ParsedProductRow[]; totalErrors: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

        const rows: ParsedProductRow[] = rawRows.map((raw, i) => {
          const nombre = readField(raw, 'nombre', 'Nombre', 'NOMBRE')
          const categoria = readField(raw, 'categoria', 'Categoría', 'Categoria', 'CATEGORIA')
          const marca = readField(raw, 'marca', 'Marca', 'MARCA')
          const sku = readField(raw, 'sku', 'SKU', 'Sku')
          const descripcion = readField(raw, 'descripcion', 'Descripción', 'Descripcion', 'DESCRIPCION')
          const unidad = readField(raw, 'unidad', 'Unidad', 'UNIDAD')
          const estadoRaw = readField(raw, 'estado', 'Estado', 'ESTADO').toLowerCase()

          const precioRaw = raw['precio'] ?? raw['Precio'] ?? raw['PRECIO'] ?? ''
          const stockRaw = raw['stock'] ?? raw['Stock'] ?? raw['STOCK'] ?? ''
          const precio = precioRaw === '' ? null : Number(precioRaw)
          const stock = stockRaw === '' ? null : Number(stockRaw)

          let estado: 'active' | 'paused' | 'out_of_stock' = 'active'
          if (VALID_ESTADOS.includes(estadoRaw)) {
            estado = estadoRaw as typeof estado
          } else if (stock === 0) {
            estado = 'out_of_stock'
          }

          const errors: string[] = []
          if (!nombre) errors.push('Nombre requerido')
          if (!categoria) errors.push('Categoría requerida')
          if (precio === null || isNaN(precio)) errors.push('Precio inválido')
          else if (precio < 0) errors.push('Precio debe ser ≥ 0')
          if (stock === null || isNaN(stock)) errors.push('Stock inválido')
          else if (stock < 0) errors.push('Stock debe ser ≥ 0')

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
