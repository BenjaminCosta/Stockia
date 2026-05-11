// User roles
export type UserRole = 'comercio' | 'distribuidora'

// User types
export interface User {
  id: string
  email: string
  role: UserRole
  createdAt: string
}

export interface Comercio extends User {
  role: 'comercio'
  storeName: string
  razonSocial: string
  cuit: string
  phone: string
  address: string
  location: {
    lat: number
    lng: number
    city: string
    zone: string
  }
}

export interface Distribuidora extends User {
  role: 'distribuidora'
  companyName: string
  razonSocial: string
  cuit: string
  phone: string
  address: string
  coverageRadiusKm: number
  minOrder: number
  deliveryTimeLabel: string  // "48 horas hábiles", "Mismo día", "En 2hs"
  deliveryTimeHours: number  // for computing estimated date
  deliveryZones: string[]
  deliveryHours: string      // "Lunes a Viernes · 8 a 17hs"
  location: {
    lat: number
    lng: number
    city: string
  }
}

// Product types
export interface Product {
  id: string
  distribuidoraId: string
  name: string
  category: string
  price: number
  stock: number
  description: string
  imageUrl?: string
  active: boolean
  rating: number
  reviewCount: number
}

// Category type
export interface Category {
  id: string
  name: string
  iconName: string
  image: string
}

// Distributor card type (for comercio view)
export interface DistributorCard {
  id: string
  companyName: string
  initials: string
  distance: string
  deliveryInfo: string
  minOrder: number
  productCount: number
  categories: string[]
}

// Cart types
export interface CartItem {
  product: Product
  quantity: number
}

export interface Cart {
  distribuidoraId: string
  distribuidoraName: string
  items: CartItem[]
}

// Order types
export type OrderStatus = 'pendiente' | 'pagado' | 'en_preparacion' | 'entregado'

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface Order {
  id: string
  orderNumber: string
  comercioId: string
  comercioName: string
  distribuidoraId: string
  distribuidoraName: string
  items: OrderItem[]
  subtotal: number
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt: string
  zone: string
}

// Dashboard KPIs
export interface DashboardKPIs {
  ventasHoy: number
  pedidosHoy: number
  pendientes: number
  stockOk: number
}
