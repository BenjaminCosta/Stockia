import { useState, useCallback } from 'react'
import { uploadProductImage, uploadDistributorLogo } from '@/lib/firebase/storage.service'

type UploadType = 'product' | 'distributor-logo'

export interface UseImageUploadOptions {
  type: UploadType
  ownerId: string // distributorId
  maxSizeMb?: number
}

export interface UseImageUploadReturn {
  /** The uploaded image's download URL, or null if not yet uploaded */
  imageUrl: string | null
  /** Local object URL for preview before upload completes */
  previewUrl: string | null
  /** Upload progress 0–100, or null when idle */
  progress: number | null
  isUploading: boolean
  error: string | null
  /** Call this with the File from an <input type="file"> or drag event */
  upload: (file: File) => Promise<string | null>
  /** Clear state (e.g. when cancelling) */
  reset: () => void
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function useImageUpload({
  type,
  ownerId,
  maxSizeMb = 5,
}: UseImageUploadOptions): UseImageUploadReturn {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setImageUrl(null)
    setPreviewUrl(null)
    setProgress(null)
    setIsUploading(false)
    setError(null)
  }, [previewUrl])

  const upload = useCallback(
    async (file: File): Promise<string | null> => {
      // Client-side validation
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Formato no soportado. Usá JPG, PNG o WebP.')
        return null
      }
      if (file.size > maxSizeMb * 1024 * 1024) {
        setError(`La imagen no puede superar ${maxSizeMb}MB.`)
        return null
      }

      // Local preview immediately
      const localUrl = URL.createObjectURL(file)
      setPreviewUrl(localUrl)
      setError(null)
      setIsUploading(true)
      setProgress(0)

      try {
        const uploadFn = type === 'product' ? uploadProductImage : uploadDistributorLogo
        const url = await uploadFn(file, ownerId, pct => setProgress(pct))
        setImageUrl(url)
        setProgress(100)
        return url
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error al subir la imagen'
        setError(msg)
        setPreviewUrl(null)
        return null
      } finally {
        setIsUploading(false)
      }
    },
    [type, ownerId, maxSizeMb]
  )

  return { imageUrl, previewUrl, progress, isUploading, error, upload, reset }
}
