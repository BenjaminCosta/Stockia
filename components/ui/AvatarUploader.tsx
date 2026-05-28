'use client'

import { useRef, useState, useCallback } from 'react'
import Image from 'next/image'
import { Camera, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadDistributorLogo, uploadComercioLogo } from '@/lib/firebase/storage.service'
import { updateDocument } from '@/lib/firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'

export interface AvatarUploaderProps {
  /** The entity's Firestore doc ID */
  ownerId: string
  /** 'distribuidora' | 'comercio' — determines Storage path and Firestore collection */
  type: 'distribuidora' | 'comercio'
  /** Current logo URL from Firestore (if any) */
  currentLogoUrl?: string | null
  /** Fallback text shown when no logo is set */
  initials: string
  /** Extra classes for the outer wrapper div */
  className?: string
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 2

export function AvatarUploader({
  ownerId,
  type,
  currentLogoUrl,
  initials,
  className,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayUrl = previewUrl ?? currentLogoUrl ?? null

  const handleFile = useCallback(
    async (file: File) => {
      if (!ALLOWED.includes(file.type)) {
        setError('Usá JPG, PNG o WebP')
        return
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setError(`Máximo ${MAX_MB}MB`)
        return
      }

      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
      setError(null)
      setUploading(true)
      setProgress(0)

      try {
        const uploadFn = type === 'distribuidora' ? uploadDistributorLogo : uploadComercioLogo
        const url = await uploadFn(file, ownerId, pct => setProgress(pct))

        // Persist to Firestore
        const collection = type === 'distribuidora' ? COLLECTIONS.distributors : COLLECTIONS.commerces
        await updateDocument(collection, ownerId, { logoUrl: url })

        setPreviewUrl(url)
        URL.revokeObjectURL(localUrl)
      } catch (err) {
        setError('Error al subir')
        setPreviewUrl(null)
        console.error('[AvatarUploader] upload failed', err)
      } finally {
        setUploading(false)
        setProgress(null)
      }
    },
    [type, ownerId]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        handleFile(file)
        e.target.value = ''
      }
    },
    [handleFile]
  )

  return (
    <div className={cn('relative group cursor-pointer shrink-0', className)} onClick={() => !uploading && inputRef.current?.click()}>
      {/* Avatar */}
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-[inherit] border border-white/45 bg-white font-heading font-bold text-[#080f2b] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_34px_rgba(0,0,0,0.22)]">
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Logo"
            fill
            className="object-cover"
            sizes="96px"
            unoptimized={displayUrl.startsWith('blob:')}
          />
        ) : (
          <span className="select-none">{initials}</span>
        )}

        {/* Upload progress overlay */}
        {uploading && progress !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55 gap-1">
            <Loader2 className="h-5 w-5 text-white animate-spin" />
            <span className="text-white text-[10px] font-bold">{progress}%</span>
          </div>
        )}
      </div>

      {/* Camera hover overlay — hidden while uploading */}
      {!uploading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-black/0 group-hover:bg-black/45 transition-all duration-200">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center gap-0.5">
            <Camera className="h-5 w-5 text-white drop-shadow" />
            <span className="text-[9px] font-bold text-white/90 tracking-wide uppercase">Cambiar</span>
          </div>
        </div>
      )}

      {/* Error tooltip */}
      {error && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow">
          {error}
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleChange}
        aria-label="Cambiar logo"
      />
    </div>
  )
}
