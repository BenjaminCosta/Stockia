'use client'

import { useRef, useState, useCallback } from 'react'
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'
import { parseProductsFile, type ParsedProductRow } from '@/lib/import/productsImport'
import { formatCurrency } from '@/lib/mock-data'

type Step = 'idle' | 'loaded' | 'validating' | 'ready' | 'errors' | 'done'

const estadoLabels: Record<string, string> = {
  active: 'Activo',
  paused: 'Pausado',
  out_of_stock: 'Sin stock',
}

interface Props {
  onClose: () => void
  onImport: (rows: ParsedProductRow[]) => void
}

export default function ImportProductsModal({ onClose, onImport }: Props) {
  const [step, setStep] = useState<Step>('idle')
  const [rows, setRows] = useState<ParsedProductRow[]>([])
  const [totalErrors, setTotalErrors] = useState(0)
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(async (file: File) => {
    setFileName(file.name)
    setStep('validating')
    try {
      const result = await parseProductsFile(file)
      setRows(result.rows)
      setTotalErrors(result.totalErrors)
      setStep(result.totalErrors > 0 ? 'errors' : 'ready')
    } catch {
      setStep('idle')
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  const handleConfirm = () => {
    const validRows = rows.filter((r) => !r.hasErrors)
    onImport(validRows)
    setStep('done')
    setTimeout(onClose, 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-[#F1FFD1] rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-[#4A662E]" />
            </div>
            <div>
              <h2 className="font-heading font-bold text-lg text-gray-900">Importar productos</h2>
              <p className="text-xs text-gray-400">Archivos .xlsx o .csv</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* Done state */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-heading font-bold text-lg text-gray-900">Importación completada</p>
                <p className="text-sm text-gray-400 mt-1">
                  {rows.filter((r) => !r.hasErrors).length} productos importados correctamente
                </p>
              </div>
            </div>
          )}

          {/* Validating */}
          {step === 'validating' && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-gray-500">Validando archivo...</p>
            </div>
          )}

          {/* Idle — upload zone */}
          {step === 'idle' && (
            <div
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-4 text-center cursor-pointer transition-colors ${
                isDragging ? 'border-primary bg-[#F1FFD1]/30' : 'border-gray-200 hover:border-gray-300'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <div className="h-14 w-14 bg-gray-50 rounded-2xl flex items-center justify-center">
                <Upload className="h-7 w-7 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-700">Arrastrar archivo o hacer clic</p>
                <p className="text-sm text-gray-400 mt-1">Formatos soportados: .xlsx, .xls, .csv</p>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          )}

          {/* Preview table */}
          {(step === 'ready' || step === 'errors') && (
            <>
              {/* Summary strip */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                  <FileSpreadsheet className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-700">{fileName}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="font-semibold text-green-700">{rows.filter((r) => !r.hasErrors).length} válidos</span>
                </div>
                {totalErrors > 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-red-700">{totalErrors} con errores</span>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-2.5 font-bold text-gray-500 uppercase tracking-wider">Fila</th>
                        <th className="text-left px-3 py-2.5 font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                        <th className="text-left px-3 py-2.5 font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Categoría</th>
                        <th className="text-right px-3 py-2.5 font-bold text-gray-500 uppercase tracking-wider">Precio</th>
                        <th className="text-right px-3 py-2.5 font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                        <th className="text-left px-3 py-2.5 font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Estado</th>
                        <th className="text-left px-3 py-2.5 font-bold text-gray-500 uppercase tracking-wider">Errores</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((row) => (
                        <tr
                          key={row.rowIndex}
                          className={row.hasErrors ? 'bg-red-50/40' : 'hover:bg-gray-50/50'}
                        >
                          <td className="px-3 py-2.5 font-mono text-gray-400">{row.rowIndex}</td>
                          <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[140px] truncate">
                            {row.nombre || <span className="text-red-400 italic">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">
                            {row.categoria || <span className="text-red-400 italic">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right font-medium text-gray-800">
                            {row.precio !== null && !isNaN(row.precio) ? formatCurrency(row.precio) : <span className="text-red-400">—</span>}
                          </td>
                          <td className="px-3 py-2.5 text-right text-gray-700">
                            {row.stock !== null && !isNaN(row.stock) ? row.stock : <span className="text-red-400">—</span>}
                          </td>
                          <td className="px-3 py-2.5 hidden sm:table-cell">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              row.estado === 'active' ? 'bg-green-50 text-green-700' :
                              row.estado === 'out_of_stock' ? 'bg-amber-50 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {estadoLabels[row.estado]}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            {row.hasErrors ? (
                              <div className="flex flex-col gap-0.5">
                                {row.errors.map((e, i) => (
                                  <span key={i} className="text-red-600 font-medium">{e}</span>
                                ))}
                              </div>
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error notice */}
              {totalErrors > 0 && (
                <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">
                    Las filas con errores serán ignoradas. Podés corregirlas en el archivo y volver a importar, o importar solo las filas válidas.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {(step === 'ready' || step === 'errors') && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={() => { setStep('idle'); setRows([]); setFileName('') }}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cambiar archivo
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="h-10 px-5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={rows.filter((r) => !r.hasErrors).length === 0}
                className="h-10 px-5 rounded-xl bg-primary text-white text-sm font-bold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Importar {rows.filter((r) => !r.hasErrors).length} productos
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
