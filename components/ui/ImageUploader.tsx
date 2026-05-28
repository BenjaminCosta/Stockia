'use client'

import { useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ImageUploaderProps {
  /** Current preview URL (local blob or remote URL) */
  previewUrl: string | null
  /** Upload progress 0–100, null when idle */
  progress: number | null
  isUploading: boolean
  error: string | null
  /** Called with the File chosen by the user */
  onFileSelect: (file: File) => void
  /** Called when the user removes the current image */
  onRemove: () => void
  label?: string
  hint?: string
  className?: string
}

export function ImageUploader({
  previewUrl,
  progress,
  isUploading,
  error,
  onFileSelect,
  onRemove,
  label = 'Imagen del producto',
  hint = 'PNG, JPG o WebP hasta 5 MB',
  className,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = useCallback(() => {
    if (!isUploading) inputRef.current?.click()
  }, [isUploading])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFileSelect(file)
        // Reset input so the same file can be selected again if needed
        e.target.value = ''
      }
    },
    [onFileSelect]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) onFileSelect(file)
    },
    [onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }, [])

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium text-foreground">{label}</label>

      <div
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onKeyDown={e => e.key === 'Enter' && handleClick()}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          previewUrl
            ? 'border-transparent cursor-default'
            : 'border-[#DFE1E8] hover:border-primary/40 cursor-pointer bg-[#F7F8FA]',
          isUploading && 'pointer-events-none opacity-80'
        )}
      >
        {/* ── Preview state ──────────────────────────────────────────────── */}
        {previewUrl ? (
          <div className="relative w-full aspect-square max-h-56">
            <Image
              src={previewUrl}
              alt="Vista previa"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              unoptimized={previewUrl.startsWith('blob:')}
            />

            {/* Progress overlay */}
            {isUploading && progress !== null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-2">
                <Loader2 className="h-7 w-7 text-white animate-spin" />
                <span className="text-white text-sm font-semibold">{progress}%</span>
                <div className="w-32 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#C8FF00] rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Remove button */}
            {!isUploading && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                aria-label="Eliminar imagen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* ── Empty state ─────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center gap-2 py-10 px-4 text-center">
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            ) : (
              <div className="h-12 w-12 rounded-2xl bg-white border border-[#DFE1E8] flex items-center justify-center shadow-sm">
                <Upload className="h-5 w-5 text-[#0B1A45]/60" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-[#0B1A45]">
                {isUploading ? 'Subiendo imagen…' : 'Arrastrá o hacé clic para subir'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <ImageOff className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        onChange={handleChange}
        aria-label="Seleccionar imagen"
      />
    </div>
  )
}
