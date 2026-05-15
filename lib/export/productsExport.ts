import * as XLSX from 'xlsx'
import type { Product } from '../types'

function buildSheet(rows: Record<string, unknown>[]) {
  const ws = XLSX.utils.json_to_sheet(rows)
  // Set column widths for readability
  ws['!cols'] = [
    { wch: 30 }, // nombre
    { wch: 18 }, // categoria
    { wch: 15 }, // marca
    { wch: 12 }, // sku
    { wch: 35 }, // descripcion
    { wch: 10 }, // precio
    { wch: 8 },  // stock
    { wch: 8 },  // unidad
    { wch: 12 }, // estado
  ]
  return ws
}

export function exportProductsToXlsx(products: Product[], filename = 'productos') {
  const rows = products.map((p) => ({
    nombre: p.name,
    categoria: p.category,
    marca: '',
    sku: '',
    descripcion: p.description ?? '',
    precio: p.price,
    stock: p.stock,
    unidad: 'un.',
    estado: p.active ? 'active' : 'paused',
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildSheet(rows), 'Productos')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export function downloadTemplate() {
  const example = [
    {
      nombre: 'Fideos Marolio 500g',
      categoria: 'Almacén',
      marca: 'Marolio',
      sku: 'FID-500',
      descripcion: 'Fideos largos tallarín',
      precio: 450,
      stock: 100,
      unidad: 'un.',
      estado: 'active',
    },
    {
      nombre: 'Aceite Cocinero 900ml',
      categoria: 'Aceites',
      marca: 'Cocinero',
      sku: 'ACE-900',
      descripcion: 'Aceite de girasol refinado',
      precio: 1200,
      stock: 0,
      unidad: 'un.',
      estado: 'out_of_stock',
    },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, buildSheet(example), 'Productos')
  XLSX.writeFile(wb, 'plantilla_productos.xlsx')
}
