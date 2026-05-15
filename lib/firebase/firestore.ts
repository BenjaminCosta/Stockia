import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  type DocumentData,
  type WhereFilterOp,
} from 'firebase/firestore'
import { db } from './client'

// ─── Generic helpers ──────────────────────────────────────────────────────────

/** Get a single document by ID. Returns null if not found. */
export async function getDocument<T = DocumentData>(
  collectionName: string,
  id: string
): Promise<(T & { id: string }) | null> {
  try {
    const ref = doc(db, collectionName, id)
    const snap = await getDoc(ref)
    if (!snap.exists()) return null
    return { id: snap.id, ...(snap.data() as T) }
  } catch (err) {
    console.error(`[firestore] getDocument(${collectionName}/${id})`, err)
    throw err
  }
}

/** Get all documents in a collection. */
export async function getCollection<T = DocumentData>(
  collectionName: string
): Promise<(T & { id: string })[]> {
  try {
    const ref = collection(db, collectionName)
    const snap = await getDocs(ref)
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as T) }))
  } catch (err) {
    console.error(`[firestore] getCollection(${collectionName})`, err)
    throw err
  }
}

/** Create a document with an auto-generated ID. Returns the new ID. */
export async function createDocument(
  collectionName: string,
  data: Record<string, unknown>
): Promise<string> {
  try {
    const ref = collection(db, collectionName)
    const docRef = await addDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return docRef.id
  } catch (err) {
    console.error(`[firestore] createDocument(${collectionName})`, err)
    throw err
  }
}

/** Create or overwrite a document with a specific ID. */
export async function setDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const ref = doc(db, collectionName, id)
    await setDoc(ref, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.error(`[firestore] setDocument(${collectionName}/${id})`, err)
    throw err
  }
}

/** Partially update a document. */
export async function updateDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const ref = doc(db, collectionName, id)
    await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
  } catch (err) {
    console.error(`[firestore] updateDocument(${collectionName}/${id})`, err)
    throw err
  }
}

/** Delete a document by ID. */
export async function deleteDocument(
  collectionName: string,
  id: string
): Promise<void> {
  try {
    const ref = doc(db, collectionName, id)
    await deleteDoc(ref)
  } catch (err) {
    console.error(`[firestore] deleteDocument(${collectionName}/${id})`, err)
    throw err
  }
}

/** Query documents where a field matches a value. */
export async function getDocumentsByField<T = DocumentData>(
  collectionName: string,
  field: string,
  operator: WhereFilterOp,
  value: unknown
): Promise<(T & { id: string })[]> {
  try {
    const ref = collection(db, collectionName)
    const q = query(ref, where(field, operator, value))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as T) }))
  } catch (err) {
    console.error(`[firestore] getDocumentsByField(${collectionName}, ${field})`, err)
    throw err
  }
}
