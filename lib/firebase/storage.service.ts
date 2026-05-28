import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './client'

export type UploadProgressCallback = (progress: number) => void

/**
 * Upload a product image to Storage.
 * Path: products/{distributorId}/{timestamp}_{filename}
 * Returns the public download URL.
 */
export async function uploadProductImage(
  file: File,
  distributorId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!storage) throw new Error('Firebase Storage no está inicializado')

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}.${ext}`
  const path = `products/${distributorId}/${filename}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    })

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(pct)
      },
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}

/**
 * Upload a distributor logo to Storage.
 * Path: distribuidoras/{distributorId}/logo/{timestamp}_{filename}
 * Returns the public download URL.
 */
export async function uploadDistributorLogo(
  file: File,
  distributorId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!storage) throw new Error('Firebase Storage no está inicializado')

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}.${ext}`
  const path = `distribuidoras/${distributorId}/logo/${filename}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    })

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(pct)
      },
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}

/**
 * Upload a commerce (comercio) logo to Storage.
 * Path: comercios/{comercioId}/logo/{timestamp}_{filename}
 * Returns the public download URL.
 */
export async function uploadComercioLogo(
  file: File,
  comercioId: string,
  onProgress?: UploadProgressCallback
): Promise<string> {
  if (!storage) throw new Error('Firebase Storage no está inicializado')

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${Date.now()}.${ext}`
  const path = `comercios/${comercioId}/logo/${filename}`
  const storageRef = ref(storage, path)

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    })

    task.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        onProgress?.(pct)
      },
      reject,
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        } catch (err) {
          reject(err)
        }
      }
    )
  })
}

/**
 * Delete a file from Storage by its full download URL.
 * Safe to call even if the URL is undefined.
 */
export async function deleteStorageFile(downloadUrl: string): Promise<void> {
  if (!storage || !downloadUrl) return
  try {
    const fileRef = ref(storage, downloadUrl)
    await deleteObject(fileRef)
  } catch {
    // File may not exist — ignore
  }
}
