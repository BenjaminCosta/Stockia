'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from './firebase/client'
import { buildLocationKey, hasRealCoordinates, normalizeCitySlug, normalizeTextSlug } from './firebase/geo'
import { normalizeLocationInput } from './locations/location-utils'
import { getUserById, getCommerceById } from './data/users.service'
import { getDistributorById } from './data/distributors.service'
import { setSessionCookie, clearSessionCookie } from './cookies'
import { UserRole, Comercio, Distribuidora, Cart, Product, Order } from './types'
import { useComercioOrders, useDistribuidoraOrders } from '@/hooks/use-data'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface AppContextType {
  // Auth state
  isAuthenticated: boolean
  authLoading: boolean
  userRole: UserRole | 'admin' | null
  currentUser: Comercio | Distribuidora | null
  firebaseUser: FirebaseUser | null

  // Auth actions
  login: (email: string, password: string) => Promise<UserRole>
  logout: () => Promise<void>

  // Cart state
  cart: Cart | null

  // Cart actions
  addToCart: (product: Product, distribuidoraName: string, quantity?: number) => boolean
  removeFromCart: (productId: string) => void
  updateCartItemQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number

  // Wishlist state
  wishlist: Product[]

  // Wishlist actions
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: string) => void
  toggleWishlist: (product: Product) => void
  isInWishlist: (productId: string) => boolean

  // Orders (commerce) — shared single listener
  commerceOrders: Order[]
  ordersLoading: boolean

  // Orders (distribuidora) — shared single listener
  distribuidoraOrders: Order[]
  distribuidoraOrdersLoading: boolean
}

const AppContext = createContext<AppContextType | undefined>(undefined)

interface PendingCartReplacement {
  product: Product
  distribuidoraName: string
  quantity: number
}

function buildCartWithItem(
  prevCart: Cart | null,
  product: Product,
  distribuidoraName: string,
  quantity: number
): Cart {
  if (!prevCart || prevCart.distribuidoraId !== product.distribuidoraId) {
    return {
      distribuidoraId: product.distribuidoraId,
      distribuidoraName,
      items: [{ product, quantity }],
    }
  }

  const existingItemIndex = prevCart.items.findIndex(
    item => item.product.id === product.id
  )

  if (existingItemIndex >= 0) {
    const newItems = [...prevCart.items]
    newItems[existingItemIndex] = {
      ...newItems[existingItemIndex],
      quantity: newItems[existingItemIndex].quantity + quantity,
    }
    return { ...prevCart, items: newItems }
  }

  return {
    ...prevCart,
    items: [...prevCart.items, { product, quantity }],
  }
}

// Build a fully-populated Comercio/Distribuidora by combining the base user doc
// with the commerce or distributor profile doc.
async function buildCurrentUser(
  uid: string,
  email: string,
  name: string,
  role: UserRole
): Promise<Comercio | Distribuidora> {
  if (role === 'comercio') {
    const profile = await getCommerceById(uid).catch(() => null)
    const city = profile?.city || ''
    const province = profile?.province || 'Buenos Aires'
    const provinceSlug = profile?.provinceSlug || normalizeTextSlug(province)
    const citySlug = profile?.citySlug || normalizeCitySlug(city)
    const locationKey = profile?.locationKey || profile?.zoneKey || buildLocationKey(provinceSlug, citySlug)
    return {
      id: uid,
      email,
      role: 'comercio',
      storeName: profile?.businessName || name,
      razonSocial: '',
      cuit: profile?.cuit || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      location: {
        // Treat 0 as "no real coords" (Null Island — always invalid for ARG)
        lat: hasRealCoordinates(profile?.lat, profile?.lng) ? profile?.lat : null,
        lng: hasRealCoordinates(profile?.lat, profile?.lng) ? profile?.lng : null,
        province,
        provinceSlug,
        city,
        citySlug,
        locationKey,
      },
      createdAt: '',
    }
  }
  const profile = await getDistributorById(uid).catch(() => null)
  const distLat = (profile as any)?.location?.lat
  const distLng = (profile as any)?.location?.lng
  const normalizedDistLocation = normalizeLocationInput({
    province: (profile as any)?.location?.province || 'Buenos Aires',
    city: (profile as any)?.location?.city || '',
  })
  return {
    id: uid,
    email,
    role: 'distribuidora',
    companyName: (profile as any)?.companyName || name,
    razonSocial: (profile as any)?.razonSocial || '',
    cuit: (profile as any)?.cuit || '',
    phone: (profile as any)?.phone || '',
    address: (profile as any)?.address || '',
    coverageRadiusKm: (profile as any)?.coverageRadiusKm ?? 0,
    minOrder: (profile as any)?.minOrder ?? 0,
    deliveryTimeLabel: (profile as any)?.deliveryTimeLabel || '',
    deliveryTimeHours: (profile as any)?.deliveryTimeHours ?? 24,
    deliveryZones: (profile as any)?.deliveryZones ?? [],
    deliveryLocationKeys: (profile as any)?.deliveryLocationKeys ?? (profile as any)?.deliveryZoneKeys ?? [],
    deliveryZoneKeys: (profile as any)?.deliveryZoneKeys ?? [],
    deliveryHours: (profile as any)?.deliveryHours || '',
    location: {
      // Treat 0 as "no real coords"
      ...normalizedDistLocation,
      lat: hasRealCoordinates(distLat, distLng) ? distLat : null,
      lng: hasRealCoordinates(distLat, distLng) ? distLng : null,
    },
    commissionRate: (profile as any)?.commissionRate ?? 0.015,
    commissionStatus: (profile as any)?.commissionStatus ?? 'ok',
    createdAt: '',
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | 'admin' | null>(null)
  const [currentUser, setCurrentUser] = useState<Comercio | Distribuidora | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [cart, setCart] = useState<Cart | null>(null)
  const [pendingCartReplacement, setPendingCartReplacement] = useState<PendingCartReplacement | null>(null)
  const [wishlist, setWishlist] = useState<Product[]>([])

  // Cache userDoc from login() to avoid duplicate Firestore read in onAuthStateChanged
  const loginCacheRef = useRef<{ uid: string; userDoc: Record<string, unknown> } | null>(null)

  // Single shared orders listeners for the whole app
  const comercio = currentUser?.role === 'comercio' ? currentUser as Comercio : null
  const distribuidora = currentUser?.role === 'distribuidora' ? currentUser as Distribuidora : null
  const { data: commerceOrders, loading: ordersLoading } = useComercioOrders(comercio?.id || '')
  const { data: distribuidoraOrders, loading: distribuidoraOrdersLoading } = useDistribuidoraOrders(distribuidora?.id || '')

  // Hydrate wishlist from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('stockia_wishlist')
      if (stored) setWishlist(JSON.parse(stored))
    } catch {}
  }, [])

  // Persist wishlist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('stockia_wishlist', JSON.stringify(wishlist))
    } catch {}
  }, [wishlist])

  // Restore session from Firebase Auth on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setIsAuthenticated(false)
        setUserRole(null)
        setCurrentUser(null)
        setFirebaseUser(null)
        setAuthLoading(false)
        return
      }

      setFirebaseUser(fbUser)

      try {
        // Reuse cached userDoc from login() to avoid a duplicate Firestore read
        let userDoc: Record<string, unknown> | null = null
        const cached = loginCacheRef.current
        if (cached && cached.uid === fbUser.uid) {
          userDoc = cached.userDoc
          loginCacheRef.current = null
        } else {
          userDoc = await getUserById(fbUser.uid) as unknown as Record<string, unknown> | null
        }
        if (userDoc?.role === 'admin') {
          setIsAuthenticated(true)
          setUserRole('admin')
          setCurrentUser(null)
          setSessionCookie('admin')
        } else if (userDoc && (userDoc.role === 'comercio' || userDoc.role === 'distribuidora')) {
          setIsAuthenticated(true)
          setUserRole(userDoc.role as UserRole)
          setCurrentUser(await buildCurrentUser(fbUser.uid, fbUser.email ?? '', userDoc.name as string, userDoc.role as UserRole))
          setSessionCookie(userDoc.role as string)
        } else {
          setIsAuthenticated(true)
          setUserRole(null)
          setCurrentUser(null)
          setSessionCookie('guest')
        }
      } catch {
        setIsAuthenticated(true)
        setUserRole(null)
        setCurrentUser(null)
      } finally {
        setAuthLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<UserRole> => {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    // Fetch role so we can redirect immediately after
    const userDoc = await getUserById(credential.user.uid)
    // Cache userDoc so onAuthStateChanged doesn't need to re-fetch it
    loginCacheRef.current = { uid: credential.user.uid, userDoc: userDoc as unknown as Record<string, unknown> }
    const role: UserRole =
      userDoc?.role === 'comercio' || userDoc?.role === 'distribuidora'
        ? userDoc.role
        : 'comercio'
    // Set session cookie NOW — before router.push() — so the middleware finds it
    // when the navigation request arrives. onAuthStateChanged will also set it later (no-op).
    setSessionCookie(userDoc?.role === 'admin' ? 'admin' : role)
    return role
  }, [])

  const logout = useCallback(async () => {
    setCart(null)
    setPendingCartReplacement(null)
    clearSessionCookie()
    await signOut(auth)
    // onAuthStateChanged will clear remaining state
  }, [])

  const addToCart = useCallback((product: Product, distribuidoraName: string, quantity: number = 1) => {
    if (cart && cart.distribuidoraId !== product.distribuidoraId) {
      setPendingCartReplacement({ product, distribuidoraName, quantity })
      return false
    }

    setCart(prevCart => buildCartWithItem(prevCart, product, distribuidoraName, quantity))
    return true
  }, [cart])

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => {
      if (!prevCart) return null
      const newItems = prevCart.items.filter(item => item.product.id !== productId)
      if (newItems.length === 0) return null
      return { ...prevCart, items: newItems }
    })
  }, [])

  const updateCartItemQuantity = useCallback((productId: string, quantity: number) => {
    setCart(prevCart => {
      if (!prevCart) return null
      if (quantity <= 0) {
        const newItems = prevCart.items.filter(item => item.product.id !== productId)
        if (newItems.length === 0) return null
        return { ...prevCart, items: newItems }
      }
      const newItems = prevCart.items.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
      return { ...prevCart, items: newItems }
    })
  }, [])

  const clearCart = useCallback(() => {
    setCart(null)
    setPendingCartReplacement(null)
  }, [])

  const confirmCartReplacement = useCallback(() => {
    if (!pendingCartReplacement) return

    setCart(buildCartWithItem(
      null,
      pendingCartReplacement.product,
      pendingCartReplacement.distribuidoraName,
      pendingCartReplacement.quantity
    ))
    setPendingCartReplacement(null)
  }, [pendingCartReplacement])

  const addToWishlist = useCallback((product: Product) => {
    setWishlist(prev => prev.some(p => p.id === product.id) ? prev : [...prev, product])
  }, [])

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist(prev => prev.filter(p => p.id !== productId))
  }, [])

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist(prev =>
      prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    )
  }, [])

  const isInWishlist = useCallback((productId: string) => {
    return wishlist.some(p => p.id === productId)
  }, [wishlist])

  const getCartTotal = useCallback(() => {
    if (!cart) return 0
    return cart.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    )
  }, [cart])

  const getCartItemCount = useCallback(() => {
    if (!cart) return 0
    return cart.items.reduce((count, item) => count + item.quantity, 0)
  }, [cart])

  const contextValue = useMemo(() => ({
    isAuthenticated,
    authLoading,
    userRole,
    currentUser,
    firebaseUser,
    login,
    logout,
    cart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    getCartTotal,
    getCartItemCount,
    wishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    commerceOrders,
    ordersLoading,
    distribuidoraOrders,
    distribuidoraOrdersLoading,
  }), [
    isAuthenticated, authLoading, userRole, currentUser, firebaseUser,
    login, logout, cart, addToCart, removeFromCart, updateCartItemQuantity,
    clearCart, getCartTotal, getCartItemCount, wishlist,
    addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist,
    commerceOrders, ordersLoading, distribuidoraOrders, distribuidoraOrdersLoading,
  ])

  return (
    <AppContext.Provider value={contextValue}>
      {children}
      <AlertDialog
        open={!!pendingCartReplacement}
        onOpenChange={(open) => {
          if (!open) setPendingCartReplacement(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reemplazar carrito actual</AlertDialogTitle>
            <AlertDialogDescription>
              Tu carrito actual es de {cart?.distribuidoraName || 'otra distribuidora'}. Si seguís, vamos a vaciarlo y empezar uno nuevo con productos de {pendingCartReplacement?.distribuidoraName || 'esta distribuidora'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir con mi carrito</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCartReplacement}>
              Empezar carrito nuevo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
