import * as XLSX from 'xlsx'

export interface ParsedProductRow {
  rowIndex: number
  id_interno: string
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

export function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// ─── Mapeo de categoría libre → categoría estándar del sistema ────────────────

/**
 * Mapea cualquier texto libre de categoría (ej. "CACHI", "BEBIDAS", "LACTEOS")
 * a una de las 12 categorías estándar de Stockia.
 * Útil para normalizar productos importados desde CSV.
 */
export function mapToSystemCategory(raw: string): string {
  const n = norm(raw)

  const rules: [string, string[]][] = [
    ['Bebidas', [
      // genérico
      'bebida', 'bebidas', 'bebidasyaguas', 'bebidasygaseosas',
      // gaseosas
      'gaseosa', 'gaseosas', 'refresco', 'refrescos', 'soda', 'sodas',
      // jugos y néctares
      'jugo', 'jugos', 'juguito', 'juguitos', 'nectar', 'nectares', 'naranjada', 'limonada', 'pomelo',
      // aguas
      'agua', 'aguas', 'aguamineral', 'aguacongas', 'aguasingas',
      // alcoholicas
      'cerveza', 'cervezas', 'vino', 'vinos', 'espumante', 'espumantes', 'champan', 'champagne',
      'sidra', 'sidras', 'fernet', 'whisky', 'whiskey', 'ron', 'vodka', 'ginebra', 'tequila',
      'licor', 'licores', 'aperitivo', 'aperitivos', 'amaro',
      // energizantes / isotónicas
      'energizante', 'energizantes', 'bebidaenergetica', 'bebidasenergeticas',
      'isotonica', 'isotonicas', 'isotonicoideportiva',
      // infusiones / calientes
      'cafe', 'te', 'infusion', 'infusiones', 'mate', 'yerba', 'yerbamate', 'cacao',
    ]],
    ['Almacén', [
      // genérico
      'almacen', 'almacenes', 'despensa', 'abarrote', 'abarrotes', 'bazar',
      // secos
      'seco', 'secos', 'productossecos', 'alimentossecos',
      // pastas / arroces
      'pasta', 'pastas', 'fideo', 'fideos', 'arroz', 'arroces', 'polenta', 'cuscus',
      // harinas / repostería base
      'harina', 'harinas', 'leudante', 'almidón', 'almidon', 'maicena', 'fecula', 'semola',
      // conservas / enlatados
      'conserva', 'conservas', 'enlatado', 'enlatados', 'lata', 'latas', 'puré', 'pure',
      'tomate', 'extracto', 'salsadetomaté', 'salsadetomate',
      // caldos / sopas
      'sopa', 'sopas', 'caldo', 'caldos', 'sobresopa',
      // salsas / aderezos / aceites
      'salsa', 'salsas', 'aderezo', 'aderezos', 'mayonesa', 'ketchup', 'mostaza',
      'chimichurri', 'aceite', 'aceites', 'oliva', 'vinagre',
      // azúcar / endulzantes
      'azucar', 'azucares', 'endulzante', 'endulzantes', 'edulcorante', 'edulcorantes',
      'miel', 'mermelada', 'mermeladas', 'dulcedeleche', 'jalea',
      // especias / condimentos
      'sal', 'pimienta', 'condimento', 'condimentos', 'especia', 'especias',
      'oregano', 'aji', 'comino',
      // legumbres / granos
      'legumbre', 'legumbres', 'grano', 'granos', 'lenteja', 'lentejas',
      'garbanzo', 'garbanzos', 'poroto', 'porotos', 'arveja', 'arvejas',
      // cereales
      'cereal', 'cereales', 'granola', 'avena', 'maiz',
    ]],
    ['Lácteos', [
      'lacteo', 'lacteos', 'lacteos', 'productolácteo', 'productolacteo', 'productoslácteos', 'productoslag',
      'leche', 'lecheenpolvo', 'lechedescremada', 'lecheentera',
      'yogur', 'yogurt', 'yogures', 'yoghurt',
      'queso', 'quesos', 'quesofresco', 'quesomozzarella', 'quesocuartirolo',
      'quesocrema', 'quesouncable', 'quesoroquefort',
      'manteca', 'mantequilla', 'margarina',
      'ricota', 'requesón', 'requesón',
      'postre', 'postres', 'flan', 'mousse',
      'dairy',
    ]],
    ['Panadería', [
      'panaderia', 'panificado', 'panificados', 'panificacion',
      'bolleria', 'confiteria', 'pasteleria', 'pasteles', 'pastel',
      'bizcochuelo', 'bizcocho', 'bizcochos', 'budin', 'budines',
      'factura', 'facturas', 'medialuna', 'medialunas',
      'tostada', 'tostadas', 'tostadita', 'tostaditas',
      'torta', 'tortas', 'tortita',
      'faina', 'chipa', 'chipas',
      'masa', 'masas', 'hojaldre',
      'bakery',
      // "pan" deliberadamente al final para que no matchee "pantalla" etc.
      'pan',
    ]],
    ['Snacks', [
      'snack', 'snacks', 'copetines', 'copetine',
      'galletita', 'galletitas', 'galletasalada', 'galletadulce',
      'cracker', 'crackers',
      'papasfritas', 'papafrita', 'papasfritasdebolsa',
      'chizito', 'chizitos', 'palito', 'palitos', 'nachos', 'chips',
      'pochoclo', 'pochoclos', 'palomita', 'palomitas',
      'mani', 'manicazado', 'garrapiñada', 'garrapiñadas',
      'frutoséco', 'frutoseco', 'frutossec', 'semilla', 'semillas',
      'nuez', 'nueces', 'almendra', 'almendras', 'pasa', 'pasas',
      'mix', 'mixfrutos',
    ]],
    ['Fiambres', [
      'fiambre', 'fiambres', 'fiambreyembutido', 'fiambresyembutidos',
      'embutido', 'embutidos', 'chacinado', 'chacinados',
      'salame', 'salames', 'salamines', 'salamin',
      'salchicha', 'salchichas', 'salchichon',
      'jamon', 'jamones', 'jamoncrudo', 'jamóncocido', 'jamoncocido',
      'mortadela', 'chorizo', 'chorizos', 'morcilla', 'longaniza', 'butifarra',
      'pate', 'patee', 'leberwurst',
      'deli', 'delicatesen',
    ]],
    ['Congelados', [
      'congelado', 'congelados', 'productoscongelados', 'alimentoscongelados',
      'ultracongelado', 'ultracongelados',
      'helado', 'helados', 'icecream',
      'precocido', 'precocidos', 'rebozado', 'rebozados',
      'nugget', 'nuggets',
      'freezer', 'frozen',
    ]],
    ['Golosinas y Kiosco', [
      'golosina', 'golosinas', 'golosinasykiosco', 'kiosco', 'kiosko',
      'caramelo', 'caramelos', 'caramelito', 'caramelitos',
      'chocolate', 'chocolates', 'tableta', 'tabletas',
      'alfajor', 'alfajores', 'alfajorcito',
      'turron', 'turrones', 'nougat', 'mazapan',
      'chicle', 'chicles', 'gomademascarar', 'goma',
      'gomita', 'gomitas', 'oblea', 'obleas', 'barquillo', 'barquillos',
      'chupete', 'chupetes', 'piruleta', 'piruletas',
      'confite', 'confites', 'pastilla', 'pastillas',
      'bombon', 'bombones',
      'dulce', 'dulces',
      'candy',
    ]],
    ['Limpieza', [
      'limpieza', 'limpiezadelhogar', 'productosdelimpieza', 'productodelimpieza',
      'hogar', 'hogaryjardin',
      'detergente', 'detergentes', 'lavaplatos', 'lavarropa',
      'desinfectante', 'desinfectantes', 'higienizante', 'higienizantes',
      'lavandina', 'blanqueador', 'blanqueadores',
      'suavizante', 'suavizantes', 'jabondepolvo', 'detergenteenpolvo',
      'lustramueble', 'lustramuebles', 'lustrapisos', 'lustrametales',
      'quitamanchas', 'eliminadorderolor',
      'trapo', 'trapos', 'escoba', 'escobas', 'lampaso', 'fregona', 'cepillo',
      'esponja', 'esponjas', 'guante', 'guantes',
      'bolsadebasura', 'bolsas', 'bolsasresiduo', 'bolsaresiduos',
      'papeldecociña', 'papel', 'servilleta', 'servilletas',
      'incienso', 'vela', 'velas', 'ambientador',
      'cleaning',
    ]],
    ['Perfumería', [
      'perfumeria', 'higienepersonal', 'cuidadopersonal', 'cosmetica', 'cosmeticos',
      'higiene', 'belleza',
      'shampoo', 'champu', 'champus', 'acondicionador', 'acondicionadores', 'cremadeenjuague',
      'tratamientocapilar', 'cuidadodelcabello', 'gel', 'laca', 'fijador',
      'jabon', 'jabones', 'jabonliquido', 'jabondetocar',
      'desodorante', 'desodorantes', 'antitranspirante',
      'pastadental', 'dentifrico', 'enjuaguebucal', 'hilo dental', 'hilodental',
      'crema', 'cremas', 'cremacorporal', 'creamano', 'cremafacial',
      'maquillaje', 'cosmetico', 'labial', 'rimmel', 'base', 'polvo',
      'colonia', 'perfume', 'perfumes', 'fragancia',
      'afeitado', 'espumadeafeitar', 'rasuradora', 'maquinita',
      'panial', 'panales', 'panales', 'toallita', 'toallitas', 'higienefemenina',
      'protector solar', 'protectorsolar', 'bronceador',
      'beauty', 'toiletry', 'toiletries',
    ]],
    ['Mascotas', [
      'mascota', 'mascotas', 'animales',
      'petfood', 'petshop', 'pet',
      'perro', 'perros', 'canino', 'caninos',
      'gato', 'gatos', 'felino', 'felinos',
      'balanceado', 'balanceados', 'alimentoparamascotas', 'alimentomascota',
      'acuario', 'peces',
      'pajaro', 'pajaros', 'ave', 'aves',
      'hamster', 'conejo', 'conejos', 'roedor', 'roedores',
      'arena para gatos', 'arenagato', 'arenasanitaria',
    ]],
  ]

  for (const [category, aliases] of rules) {
    if (aliases.some(alias => n === alias || n.includes(alias) || alias.includes(n))) {
      return category
    }
  }

  return 'Otros'
}

// ─── Aliases de columnas ───────────────────────────────────────────────────────
// Cualquier header que matchee (después de normalizar) se mapea al campo interno.

const ALIASES: Record<string, string[]> = {
  id_interno: [
    'id_interno', 'id', 'idinterno', 'productoid', 'docid', 'firebaseid',
  ],
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

// ─── Lectura del workbook con manejo de encoding ──────────────────────────────

function readFileAsText(file: File, encoding: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file, encoding)
  })
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
    reader.onerror = reject
    reader.readAsArrayBuffer(file)
  })
}

async function readWorkbook(file: File): Promise<XLSX.WorkBook> {
  const isCSV = /\.csv$/i.test(file.name) || file.type === 'text/csv'

  if (isCSV) {
    // Para CSV el browser no sabe el encoding → intentar UTF-8 primero.
    // Si hay caracteres de reemplazo (U+FFFD) significa que era Windows-1252.
    let text = await readFileAsText(file, 'UTF-8')
    if (text.includes('\uFFFD')) {
      text = await readFileAsText(file, 'windows-1252')
    }
    return XLSX.read(text, { type: 'string' })
  }

  // XLSX/XLS: formato binario con encoding interno, no necesita detección
  const buffer = await readFileAsArrayBuffer(file)
  return XLSX.read(new Uint8Array(buffer), { type: 'array' })
}

// ─── Parser principal ──────────────────────────────────────────────────────────

export async function parseProductsFile(
  file: File,
): Promise<{ rows: ParsedProductRow[]; totalErrors: number }> {
  const workbook = await readWorkbook(file)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    // raw: true (default) → números de Excel/CSV llegan como JS number directamente
  })

  if (rawRows.length === 0) return { rows: [], totalErrors: 0 }

  // Construir mapa de columnas UNA sola vez usando los headers de la primera fila
  const headers = Object.keys(rawRows[0])
  const colMap = buildColumnMap(headers)

  const rows: ParsedProductRow[] = rawRows.map((raw, i) => {
    const id_interno  = getString(raw, colMap.id_interno)
    const nombre      = getString(raw, colMap.nombre)
    const categoria   = getString(raw, colMap.categoria)
    const marca       = getString(raw, colMap.marca)
    const sku         = getString(raw, colMap.sku)
    const descripcion = getString(raw, colMap.descripcion)
    const unidad      = getString(raw, colMap.unidad)
    const activoRaw   = getString(raw, colMap.activo)
    const estadoRaw   = getString(raw, colMap.estado)

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
      id_interno,
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

  return { rows, totalErrors: rows.filter((r) => r.hasErrors).length }
}
