'use client'

import { useState, useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { COLLECTIONS } from '@/lib/firebase/collections'
import { getDistributorCards, getDistributorById as fetchDistributor } from '@/lib/data/distributors.service'
import { getAllProducts, getProductsByDistributor } from '@/lib/data/products.service'
import { getOrdersByCommerce, getOrdersByDistributor, getOrderById } from '@/lib/data/orders.service'
import { getCategories } from '@/lib/data/categories.service'
import type { DistributorCard, Product, Order, Distribuidora, OrderStatus, Category } from '@/lib/types'

// ─── Status map: Firestore orderStatus → local OrderStatus ────────────────────
function toLocalStatus(s: string): OrderStatus {
  if (s === 'delivered') return 'entregado'
  if (s === 'preparing' || s === 'ready_or_on_the_way') return 'en_preparacion'
  if (s === 'confirmed') return 'pagado'
  return 'pendiente'
}

// Generic async-data loader hook
function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[]
): { data: T | null; loading: boolean } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const depsRef = useRef(deps)
  depsRef.current = deps

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetcher()
      .then(result => { if (!cancelled) { setData(result); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading }
}

export function useDistributors(commerceLocation?: { lat: number; lng: number }) {
  const { data, loading } = useAsyncData<DistributorCard[]>(
    () => getDistributorCards(commerceLocation),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [commerceLocation?.lat, commerceLocation?.lng]
  )
  return { data: data ?? [], loading }
}

export function useDistributor(id: string) {
  const { data, loading } = useAsyncData<Distribuidora | null>(
    () => id ? fetchDistributor(id) as Promise<Distribuidora | null> : Promise.resolve(null),
    [id]
  )
  return { data, loading }
}

export function useProducts(distributorId?: string) {
  const { data, loading } = useAsyncData<Product[]>(
    () => (distributorId ? getProductsByDistributor(distributorId) : getAllProducts()) as Promise<Product[]>,
    [distributorId]
  )
  return { data: data ?? [], loading }
}

export function useCategories() {
  const { data, loading } = useAsyncData<Category[]>(
    () => getCategories(),
    []
  )
  return { data: data ?? [], loading }
}

// ─── Real-time order hooks using Firestore onSnapshot ────────────────────────

function useOrdersRealtime(field: 'commerceId' | 'distributorId', userId: string) {
  const [data, setData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    // Try Firestore real-time first
    try {
      const q = query(
        collection(db, COLLECTIONS.orders),
        where(field, '==', userId)
      )
      const unsub = onSnapshot(q,
        (snap) => {
          if (snap.empty) {
            // Fall back to mock if no real data
            const fallback = field === 'commerceId'
              ? getOrdersByCommerce(userId)
              : getOrdersByDistributor(userId)
            fallback.then(orders => { setData(orders as Order[]); setLoading(false) })
            return
          }
          const orders: Order[] = snap.docs.map(d => {
            const raw = d.data()
            return {
              id: d.id,
              orderNumber: d.id.slice(0, 8).toUpperCase(),
              comercioId: raw.commerceId ?? '',
              comercioName: raw.commerceName ?? raw.comercioName ?? '',
              distribuidoraId: raw.distributorId ?? '',
              distribuidoraName: raw.distributorName ?? raw.distribuidoraName ?? '',
              items: raw.items ?? [],
              subtotal: raw.subtotal ?? 0,
              total: raw.total ?? 0,
              status: toLocalStatus(raw.orderStatus ?? 'pending_confirmation'),
              createdAt: tsToISO(raw.createdAt),
              updatedAt: tsToISO(raw.updatedAt),
              zone: raw.zone ?? '',
              paymentMethod: raw.paymentMethod,
              firestoreStatus: raw.orderStatus ?? 'pending_confirmation',
              cancellationReason: raw.cancellationReason,
              commissionGenerated: raw.commissionGenerated ?? false,
              commissionAmount: raw.commissionAmount,
              deliveredAt: raw.deliveredAt ? tsToISO(raw.deliveredAt) : undefined,
            }
          })
          setData(orders)
          setLoading(false)
        },
        () => {
          // Permission or network error — fall back to mock
          const fallback = field === 'commerceId'
            ? getOrdersByCommerce(userId)
            : getOrdersByDistributor(userId)
          fallback.then(orders => { setData(orders as Order[]); setLoading(false) })
        }
      )
      return () => unsub()
    } catch {
      setLoading(false)
    }
  }, [field, userId])

  return { data, loading }
}

/** Safely converts a Firestore Timestamp, Date, or string to an ISO string. */
function tsToISO(val: unknown): string {
  if (!val) return new Date().toISOString()
  if (typeof (val as any).toDate === 'function') return (val as any).toDate().toISOString()
  if (val instanceof Date) return val.toISOString()
  const d = new Date(String(val))
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString()
}



export function useComercioOrders(comercioId: string) {
  return useOrdersRealtime('commerceId', comercioId)
}

export function useDistribuidoraOrders(distribuidoraId: string) {
  return useOrdersRealtime('distributorId', distribuidoraId)
}

export function useOrder(id: string) {
  const [data, setData] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) { setLoading(false); return }
    try {
      const unsub = onSnapshot(doc(db, COLLECTIONS.orders, id),
        (snap) => {
          if (!snap.exists()) {
            getOrderById(id).then(o => { setData(o as Order | null); setLoading(false) })
            return
          }
          const raw = snap.data()
          setData({
            id: snap.id,
            orderNumber: snap.id.slice(0, 8).toUpperCase(),
            comercioId: raw.commerceId ?? '',
            comercioName: raw.commerceName ?? raw.comercioName ?? '',
            distribuidoraId: raw.distributorId ?? '',
            distribuidoraName: raw.distributorName ?? raw.distribuidoraName ?? '',
            items: raw.items ?? [],
            subtotal: raw.subtotal ?? 0,
            total: raw.total ?? 0,
            status: toLocalStatus(raw.orderStatus ?? 'pending_confirmation'),
            createdAt: raw.createdAt ? tsToISO(raw.createdAt) : new Date().toISOString(),
            updatedAt: raw.updatedAt ? tsToISO(raw.updatedAt) : new Date().toISOString(),
            zone: raw.zone ?? '',
            paymentMethod: raw.paymentMethod,
            firestoreStatus: raw.orderStatus ?? 'pending_confirmation',
            cancellationReason: raw.cancellationReason,
            commissionGenerated: raw.commissionGenerated ?? false,
            commissionAmount: raw.commissionAmount,
            deliveredAt: raw.deliveredAt ? tsToISO(raw.deliveredAt) : undefined,
          })
          setLoading(false)
        },
        () => {
          getOrderById(id).then(o => { setData(o as Order | null); setLoading(false) })
        }
      )
      return () => unsub()
    } catch {
      setLoading(false)
    }
  }, [id])

  return { data, loading }
}
