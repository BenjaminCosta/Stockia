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
    /** Real WGS-84 latitude. Undefined (or 0) means no geocoords yet. */
    lat?: number
    /** Real WGS-84 longitude. Undefined (or 0) means no geocoords yet. */
    lng?: number
    city: string
    zone: string
    /** URL-safe, accent-free, lowercase version of city for zone matching. */
    citySlug: string
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
    /** Real WGS-84 latitude. Undefined (or 0) means no geocoords yet. */
    lat?: number
    /** Real WGS-84 longitude. Undefined (or 0) means no geocoords yet. */
    lng?: number
    city: string
  }
  // Commission fields
  commissionRate?: number                            // e.g. 0.015 = 1.5%
  commissionStatus?: 'ok' | 'overdue' | 'blocked'   // platform sets this
}

/**
 * Context passed from a commerce to location-aware queries.
 * When lat/lng are present and non-zero, Haversine radius is used.
 * When only citySlug is present, zone-name matching is used.
 * When neither is present, all distributors are returned.
 */
export interface CommerceContext {
  lat?: number
  lng?: number
  citySlug?: string
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
  isOffer?: boolean
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
  rating?: number
  reviewCount?: number
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
  // Extended fields (populated from Firestore or set on mock orders)
  paymentMethod?: 'mercado_pago' | 'external'
  firestoreStatus?: string  // raw Firestore orderStatus
  cancellationReason?: string
  commissionGenerated?: boolean
  commissionAmount?: number
  deliveredAt?: string
}

// Review types
export interface Review {
  id: string
  orderId: string
  orderNumber: string
  distributorId: string
  distributorName: string
  commerceId: string
  commerceName: string
  ratingGeneral: number
  ratingFulfillment: number
  ratingDelivery: number
  ratingProductCondition: number
  ratingCommunication: number
  comment: string
  status: 'visible' | 'hidden' | 'reported'
  createdAt: string
}

export interface DistributorRatingSummary {
  averageGeneral: number
  averageFulfillment: number
  averageDelivery: number
  averageProductCondition: number
  averageCommunication: number
  reviewCount: number
}

export interface CommerceHistory {
  commerceId: string
  commerceName: string
  completedOrders: number
  cancelledOrders: number
  notDeliveredOrders: number
  reportedIssues: number
  lastOrderAt: string
  joinedAt: string
}

// Commerce review — distributor rates a commerce after an order
export interface CommerceReview {
  id: string
  orderId: string
  orderNumber: string
  distributorId: string
  distributorName: string
  commerceId: string
  commerceName: string
  ratingGeneral: number
  ratingPayment: number
  ratingReception: number
  ratingCommunication: number
  ratingReliability: number
  comment: string
  status: 'visible' | 'hidden' | 'reported'
  createdAt: string
}

// Platform feedback — user sends internal feedback to Stockia
export interface PlatformFeedback {
  id: string
  userId: string
  userRole: 'comercio' | 'distribuidora'
  userName: string
  relatedOrderId?: string
  rating: number
  message: string
  category: 'general' | 'problema' | 'mejora' | 'elogio'
  status: 'new' | 'reviewed' | 'resolved'
  createdAt: string
}

// Dashboard KPIs
export interface DashboardKPIs {
  ventasHoy: number
  pedidosHoy: number
  pendientes: number
  stockOk: number
}
