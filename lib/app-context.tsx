'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from './firebase/client'
import { getUserById, getCommerceById } from './data/users.service'
import { getDistributorById } from './data/distributors.service'
import { setSessionCookie, clearSessionCookie } from './cookies'
import { UserRole, Comercio, Distribuidora, Cart, Product } from './types'

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
  addToCart: (product: Product, distribuidoraName: string, quantity?: number) => void
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
}

const AppContext = createContext<AppContextType | undefined>(undefined)

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
    return {
      id: uid,
      email,
      role: 'comercio',
      storeName: profile?.businessName || name,
      razonSocial: '',
      cuit: '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      location: {
        lat: profile?.lat ?? 0,
        lng: profile?.lng ?? 0,
        city: profile?.city || '',
        zone: '',
      },
      createdAt: '',
    }
  }
  const profile = await getDistributorById(uid).catch(() => null)
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
    deliveryHours: (profile as any)?.deliveryHours || '',
    location: {
      lat: (profile as any)?.location?.lat ?? 0,
      lng: (profile as any)?.location?.lng ?? 0,
      city: (profile as any)?.location?.city || '',
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
  const [wishlist, setWishlist] = useState<Product[]>([])

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
        const userDoc = await getUserById(fbUser.uid)
        if (userDoc?.role === 'admin') {
          setIsAuthenticated(true)
          setUserRole('admin')
          setCurrentUser(null)
          setSessionCookie('admin')
        } else if (userDoc && (userDoc.role === 'comercio' || userDoc.role === 'distribuidora')) {
          setIsAuthenticated(true)
          setUserRole(userDoc.role)
          setCurrentUser(await buildCurrentUser(fbUser.uid, fbUser.email ?? '', userDoc.name, userDoc.role))
          setSessionCookie(userDoc.role)
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
    clearSessionCookie()
    await signOut(auth)
    // onAuthStateChanged will clear remaining state
  }, [])

  const addToCart = useCallback((product: Product, distribuidoraName: string, quantity: number = 1) => {
    setCart(prevCart => {
      // If cart is empty or from different distribuidora, create new cart
      if (!prevCart || prevCart.distribuidoraId !== product.distribuidoraId) {
        return {
          distribuidoraId: product.distribuidoraId,
          distribuidoraName,
          items: [{ product, quantity }],
        }
      }

      // Check if product already in cart
      const existingItemIndex = prevCart.items.findIndex(
        item => item.product.id === product.id
      )

      if (existingItemIndex >= 0) {
        // Update quantity
        const newItems = [...prevCart.items]
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
        }
        return { ...prevCart, items: newItems }
      }

      // Add new item
      return {
        ...prevCart,
        items: [...prevCart.items, { product, quantity }],
      }
    })
  }, [])

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
  }, [])

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

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
      {children}
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
