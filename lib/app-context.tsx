'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { UserRole, Comercio, Distribuidora, Cart, CartItem, Product } from './types'
import { mockComercios, mockDistribuidoras } from './mock-data'

interface AppContextType {
  // Auth state
  isAuthenticated: boolean
  userRole: UserRole | null
  currentUser: Comercio | Distribuidora | null
  
  // Auth actions
  login: (role?: UserRole, email?: string) => UserRole
  logout: () => void
  
  // Cart state
  cart: Cart | null
  
  // Cart actions
  addToCart: (product: Product, distribuidoraName: string, quantity?: number) => void
  removeFromCart: (productId: string) => void
  updateCartItemQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemCount: () => number
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [currentUser, setCurrentUser] = useState<Comercio | Distribuidora | null>(null)
  const [cart, setCart] = useState<Cart | null>(null)

  useEffect(() => {
    const savedRole = window.localStorage.getItem('stockia-account-role')
    const savedEmail = window.localStorage.getItem('stockia-account-email')
    if (savedRole !== 'comercio' && savedRole !== 'distribuidora') return

    const comercioByEmail = mockComercios.find((user) => user.email.toLowerCase() === savedEmail)
    const distribuidoraByEmail = mockDistribuidoras.find((user) => user.email.toLowerCase() === savedEmail)

    setIsAuthenticated(true)
    setUserRole(savedRole)
    setCurrentUser(
      savedRole === 'comercio'
        ? comercioByEmail || mockComercios[0]
        : distribuidoraByEmail || mockDistribuidoras[0]
    )
  }, [])

  const login = useCallback((role?: UserRole, email?: string) => {
    const normalizedEmail = email?.trim().toLowerCase()
    const comercioByEmail = mockComercios.find((user) => user.email.toLowerCase() === normalizedEmail)
    const distribuidoraByEmail = mockDistribuidoras.find((user) => user.email.toLowerCase() === normalizedEmail)
    const savedRole =
      typeof window !== 'undefined'
        ? window.localStorage.getItem('stockia-account-role')
        : null
    const resolvedRole =
      role ||
      comercioByEmail?.role ||
      distribuidoraByEmail?.role ||
      (savedRole === 'comercio' || savedRole === 'distribuidora' ? savedRole : 'comercio')

    setIsAuthenticated(true)
    setUserRole(resolvedRole)

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('stockia-account-role', resolvedRole)
      if (normalizedEmail) {
        window.localStorage.setItem('stockia-account-email', normalizedEmail)
      }
    }

    // Set mock user based on role
    if (resolvedRole === 'comercio') {
      setCurrentUser(comercioByEmail || mockComercios[0])
    } else {
      setCurrentUser(distribuidoraByEmail || mockDistribuidoras[0])
    }

    return resolvedRole
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setUserRole(null)
    setCurrentUser(null)
    setCart(null)
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
        userRole,
        currentUser,
        login,
        logout,
        cart,
        addToCart,
        removeFromCart,
        updateCartItemQuantity,
        clearCart,
        getCartTotal,
        getCartItemCount,
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
