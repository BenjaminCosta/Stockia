// Admin data service — Firestore-first with realistic mock fallback.
// Admin users have full read access via security rules (isAdmin()).

import { getCollection, getDocument, getDocumentsByField, updateDocument, createDocument, setDocument, deleteDocument } from '../firebase/firestore'
import { COLLECTIONS } from '../firebase/collections'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdminDistributor = {
  id: string
  companyName: string
  email: string
  phone: string
  address: string
  city: string
  status: 'active' | 'paused' | 'review'
  commissionStatus?: 'ok' | 'overdue' | 'blocked'
  categories: string[]
  totalOrders: number
  totalRevenue: number
  pendingCommission: number
  joinedAt: string
  // Detail fields (populated by getAdminDistributorById)
  razonSocial?: string
  cuit?: string
  minOrder?: number
  deliveryTimeLabel?: string
  deliveryHours?: string
  commissionRate?: number
}

export type AdminCommerce = {
  id: string
  businessName: string
  email: string
  phone: string
  address: string
  city: string
  status: 'active' | 'review' | 'blocked'
  totalOrders: number
  totalSpent: number
  joinedAt: string
  // Detail fields (populated by getAdminCommerceById)
  razonSocial?: string
  cuit?: string
}

export type AdminOrder = {
  id: string
  orderNumber: string
  commerceName: string
  distributorName: string
  total: number
  paymentMethod: 'mercado_pago' | 'external'
  orderStatus: 'pending_confirmation' | 'confirmed' | 'preparing' | 'ready_or_on_the_way' | 'delivered' | 'cancelled' | 'not_delivered'
  createdAt: string
  itemCount: number
}

export type AdminCommission = {
  id: string
  distributorId: string
  distributorName: string
  period: string
  orderTotal: number
  commissionRate?: number
  commissionAmount: number
  status: 'pending' | 'paid' | 'overdue' | 'waived'
  orderId: string
  orderNumber: string
  createdAt: string
}

export type AdminCategory = {
  id: string
  name: string
  rubric: string
  iconName: string
  visible: boolean
  order: number
  distributorCount: number
}

export type AdminReview = {
  id: string
  distributorName: string
  commerceName: string
  rating: number
  comment: string
  createdAt: string
  visible: boolean
}

// ─── Mock fallback data ────────────────────────────────────────────────────────

const MOCK_DISTRIBUTORS: AdminDistributor[] = [
  { id: 'dist-1', companyName: 'Bebidas del Sur', email: 'ventas@bebidasdelsur.com', phone: '+54 11 4321-5678', address: 'Ruta 3 km 12', city: 'Lomas de Zamora', status: 'active', categories: ['Bebidas', 'Almacén'], totalOrders: 284, totalRevenue: 1_840_000, pendingCommission: 27_600, joinedAt: '2024-03-15', razonSocial: 'Transportes del Sur S.R.L.', cuit: '30-71234567-9', minOrder: 15_000, deliveryTimeLabel: '48 horas hábiles', deliveryHours: 'Lunes a Viernes · 8 a 17hs', commissionRate: 0.015 },
  { id: 'dist-2', companyName: 'Lácteos San Martín', email: 'info@lacteossm.com', phone: '+54 11 5555-1234', address: 'Av. Galicia 900', city: 'Quilmes', status: 'active', categories: ['Lácteos', 'Almacén'], totalOrders: 156, totalRevenue: 920_000, pendingCommission: 0, joinedAt: '2024-04-02', razonSocial: 'San Martín Productos Lácteos S.A.', cuit: '30-62345678-1', minOrder: 8_000, deliveryTimeLabel: '24 horas hábiles', deliveryHours: 'Lunes a Sábado · 7 a 16hs', commissionRate: 0.015 },
  { id: 'dist-3', companyName: 'Limpieza Total', email: 'contacto@limpiezatotal.ar', phone: '+54 11 4900-2222', address: 'Calle 14 N°320', city: 'Avellaneda', status: 'paused', categories: ['Limpieza'], totalOrders: 89, totalRevenue: 540_000, pendingCommission: 8_100, joinedAt: '2024-05-10', razonSocial: 'Limpieza Total Distribuciones S.R.L.', cuit: '30-58901234-5', minOrder: 10_000, deliveryTimeLabel: '72 horas hábiles', deliveryHours: 'Lunes a Viernes · 9 a 17hs', commissionRate: 0.015 },
  { id: 'dist-4', companyName: 'El Granero', email: 'hola@elgranero.com.ar', phone: '+54 11 4312-7890', address: 'Belgrano 456', city: 'Lanús', status: 'review', categories: ['Almacén', 'Lácteos'], totalOrders: 12, totalRevenue: 78_000, pendingCommission: 1_170, joinedAt: '2025-04-20', razonSocial: 'Granero Norte Distribuciones', cuit: '30-79012345-6', minOrder: 5_000, deliveryTimeLabel: '48 horas hábiles', deliveryHours: 'Lunes a Viernes · 8 a 17hs', commissionRate: 0.015 },
  { id: 'dist-5', companyName: 'Distribuidora Norte', email: 'norte@dist.com', phone: '+54 11 3311-4455', address: 'Corrientes 2100', city: 'Berazategui', status: 'active', categories: ['Bebidas', 'Snacks'], totalOrders: 201, totalRevenue: 1_230_000, pendingCommission: 18_450, joinedAt: '2024-02-01', razonSocial: 'Distribuidora del Norte S.R.L.', cuit: '30-67890123-4', minOrder: 12_000, deliveryTimeLabel: '48 horas hábiles', deliveryHours: 'Lunes a Viernes · 8 a 18hs', commissionRate: 0.015 },
]

const MOCK_COMMERCES: AdminCommerce[] = [
  { id: 'com-1', businessName: 'Almacén Don Pedro', email: 'donpedro@gmail.com', phone: '+54 11 4567-8901', address: 'Av. Mitre 1234', city: 'Avellaneda', status: 'active', totalOrders: 48, totalSpent: 340_000, joinedAt: '2024-06-01', razonSocial: 'García, Roberto Marcelo', cuit: '20-28741632-9' },
  { id: 'com-2', businessName: 'Kiosco La Esquina', email: 'laesquina@hotmail.com', phone: '+54 11 3344-5566', address: 'Rivadavia 780', city: 'Lanús', status: 'active', totalOrders: 32, totalSpent: 190_000, joinedAt: '2024-07-14', razonSocial: 'Martínez, Laura Viviana', cuit: '27-32567891-4' },
  { id: 'com-3', businessName: 'Minimercado Flores', email: 'flores.mini@gmail.com', phone: '+54 11 2233-1122', address: 'San Martín 450', city: 'Quilmes', status: 'active', totalOrders: 67, totalSpent: 520_000, joinedAt: '2024-05-22', razonSocial: 'Flores Distribuciones S.R.L.', cuit: '30-71890234-7' },
  { id: 'com-4', businessName: 'Super Don Carlos', email: 'doncarlos@live.com', phone: '+54 11 4412-9900', address: 'Corrientes 310', city: 'Avellaneda', status: 'review', totalOrders: 5, totalSpent: 22_000, joinedAt: '2025-03-10', razonSocial: 'González, Carlos Alberto', cuit: '20-15678903-1' },
  { id: 'com-5', businessName: 'El Boliche de Ramón', email: 'ramon_boliche@gmail.com', phone: '+54 11 5566-7788', address: 'Belgrano 1200', city: 'Lomas de Zamora', status: 'blocked', totalOrders: 14, totalSpent: 88_000, joinedAt: '2024-09-05', razonSocial: 'Rodríguez, Ramón Hugo', cuit: '20-22345678-9' },
]

const MOCK_ORDERS: AdminOrder[] = [
  { id: 'ord-1', orderNumber: 'ORD-0001', commerceName: 'Almacén Don Pedro', distributorName: 'Bebidas del Sur', total: 24_500, paymentMethod: 'external', orderStatus: 'delivered', createdAt: '2025-05-10T09:15:00Z', itemCount: 6 },
  { id: 'ord-2', orderNumber: 'ORD-0002', commerceName: 'Kiosco La Esquina', distributorName: 'Lácteos San Martín', total: 12_800, paymentMethod: 'mercado_pago', orderStatus: 'preparing', createdAt: '2025-05-12T14:30:00Z', itemCount: 4 },
  { id: 'ord-3', orderNumber: 'ORD-0003', commerceName: 'Minimercado Flores', distributorName: 'Bebidas del Sur', total: 38_200, paymentMethod: 'external', orderStatus: 'confirmed', createdAt: '2025-05-13T08:00:00Z', itemCount: 9 },
  { id: 'ord-4', orderNumber: 'ORD-0004', commerceName: 'Super Don Carlos', distributorName: 'El Granero', total: 6_500, paymentMethod: 'mercado_pago', orderStatus: 'pending_confirmation', createdAt: '2025-05-14T10:45:00Z', itemCount: 2 },
  { id: 'ord-5', orderNumber: 'ORD-0005', commerceName: 'Almacén Don Pedro', distributorName: 'Limpieza Total', total: 18_900, paymentMethod: 'external', orderStatus: 'cancelled', createdAt: '2025-05-11T16:20:00Z', itemCount: 5 },
  { id: 'ord-6', orderNumber: 'ORD-0006', commerceName: 'Minimercado Flores', distributorName: 'Distribuidora Norte', total: 31_000, paymentMethod: 'mercado_pago', orderStatus: 'delivered', createdAt: '2025-05-09T11:00:00Z', itemCount: 8 },
  { id: 'ord-7', orderNumber: 'ORD-0007', commerceName: 'El Boliche de Ramón', distributorName: 'Bebidas del Sur', total: 9_400, paymentMethod: 'external', orderStatus: 'not_delivered', createdAt: '2025-05-08T13:30:00Z', itemCount: 3 },
  { id: 'ord-8', orderNumber: 'ORD-0008', commerceName: 'Minimercado Flores', distributorName: 'Distribuidora Norte', total: 44_600, paymentMethod: 'external', orderStatus: 'ready_or_on_the_way', createdAt: '2025-05-14T07:20:00Z', itemCount: 11 },
]

const MOCK_COMMISSIONS: AdminCommission[] = [
  { id: 'com-1', distributorId: 'dist-1', distributorName: 'Bebidas del Sur', period: '2025-05', orderTotal: 24_500, commissionAmount: 367, status: 'pending', orderId: 'ord-1', orderNumber: 'ORD-0001', createdAt: '2025-05-10T09:15:00Z' },
  { id: 'com-2', distributorId: 'dist-5', distributorName: 'Distribuidora Norte', period: '2025-05', orderTotal: 31_000, commissionAmount: 465, status: 'pending', orderId: 'ord-6', orderNumber: 'ORD-0006', createdAt: '2025-05-09T11:00:00Z' },
  { id: 'com-3', distributorId: 'dist-1', distributorName: 'Bebidas del Sur', period: '2025-04', orderTotal: 18_200, commissionAmount: 273, status: 'paid', orderId: 'ord-prev-1', orderNumber: 'ORD-0P01', createdAt: '2025-04-22T14:00:00Z' },
  { id: 'com-4', distributorId: 'dist-3', distributorName: 'Limpieza Total', period: '2025-03', orderTotal: 54_000, commissionAmount: 810, status: 'overdue', orderId: 'ord-prev-2', orderNumber: 'ORD-0P02', createdAt: '2025-03-15T10:00:00Z' },
  { id: 'com-5', distributorId: 'dist-2', distributorName: 'Lácteos San Martín', period: '2025-04', orderTotal: 11_000, commissionAmount: 165, status: 'paid', orderId: 'ord-prev-3', orderNumber: 'ORD-0P03', createdAt: '2025-04-18T09:30:00Z' },
]

const MOCK_CATEGORIES: AdminCategory[] = [
  { id: 'cat-1',  name: 'Bebidas',           rubric: 'Alimentos y Bebidas', iconName: 'GlassWater',    visible: true,  order: 1,  distributorCount: 3 },
  { id: 'cat-2',  name: 'Almacén',           rubric: 'Alimentos y Bebidas', iconName: 'ShoppingBasket',visible: true,  order: 2,  distributorCount: 4 },
  { id: 'cat-3',  name: 'Lácteos',           rubric: 'Alimentos y Bebidas', iconName: 'Milk',          visible: true,  order: 3,  distributorCount: 2 },
  { id: 'cat-4',  name: 'Panadería',         rubric: 'Alimentos y Bebidas', iconName: 'Croissant',     visible: true,  order: 4,  distributorCount: 0 },
  { id: 'cat-5',  name: 'Snacks',            rubric: 'Alimentos y Bebidas', iconName: 'Cookie',        visible: true,  order: 5,  distributorCount: 1 },
  { id: 'cat-6',  name: 'Fiambres',          rubric: 'Alimentos y Bebidas', iconName: 'UtensilsCrossed',visible: true, order: 6,  distributorCount: 0 },
  { id: 'cat-7',  name: 'Congelados',        rubric: 'Alimentos y Bebidas', iconName: 'Snowflake',     visible: true,  order: 7,  distributorCount: 0 },
  { id: 'cat-8',  name: 'Golosinas y Kiosco',rubric: 'Alimentos y Bebidas', iconName: 'Cookie',        visible: true,  order: 8,  distributorCount: 0 },
  { id: 'cat-9',  name: 'Limpieza',          rubric: 'Limpieza e Higiene',  iconName: 'Sparkles',      visible: true,  order: 9,  distributorCount: 1 },
  { id: 'cat-10', name: 'Perfumería',        rubric: 'Limpieza e Higiene',  iconName: 'Sparkles',      visible: true,  order: 10, distributorCount: 0 },
  { id: 'cat-11', name: 'Mascotas',          rubric: 'Otros',               iconName: 'Package',       visible: true,  order: 11, distributorCount: 0 },
  { id: 'cat-12', name: 'Otros',             rubric: 'Otros',               iconName: 'Package',       visible: true,  order: 12, distributorCount: 0 },
]

const MOCK_REVIEWS: AdminReview[] = [
  { id: 'rev-1', distributorName: 'Bebidas del Sur', commerceName: 'Almacén Don Pedro', rating: 5, comment: 'Entrega puntual y productos siempre frescos. Muy recomendable.', createdAt: '2025-05-08T10:00:00Z', visible: true },
  { id: 'rev-2', distributorName: 'Lácteos San Martín', commerceName: 'Minimercado Flores', rating: 4, comment: 'Buena calidad, a veces tarda un poco más de lo prometido.', createdAt: '2025-05-05T14:30:00Z', visible: true },
  { id: 'rev-3', distributorName: 'Limpieza Total', commerceName: 'Kiosco La Esquina', rating: 2, comment: 'El último pedido llegó incompleto y tardaron en responder.', createdAt: '2025-04-28T09:15:00Z', visible: true },
  { id: 'rev-4', distributorName: 'Bebidas del Sur', commerceName: 'Super Don Carlos', rating: 1, comment: 'ESTAFA, no entregan y no devuelven el dinero!!!', createdAt: '2025-04-20T18:00:00Z', visible: false },
  { id: 'rev-5', distributorName: 'Distribuidora Norte', commerceName: 'Minimercado Flores', rating: 5, comment: 'Los mejores precios de la zona. Siempre cumplen.', createdAt: '2025-05-01T11:20:00Z', visible: true },
]

// ─── Firestore transforms ─────────────────────────────────────────────────────

function fsToDistributor(doc: Record<string, unknown> & { id: string }): AdminDistributor {
  return {
    id: doc.id,
    companyName: String(doc.companyName ?? ''),
    email: String(doc.email ?? ''),
    phone: String(doc.phone ?? ''),
    address: String(doc.address ?? ''),
    city: String(doc.city ?? (doc.location as any)?.city ?? ''),
    status: (doc.status as AdminDistributor['status']) ?? 'active',
    commissionStatus: (doc.commissionStatus as AdminDistributor['commissionStatus']) ?? undefined,
    categories: Array.isArray(doc.categories) ? doc.categories : [],
    totalOrders: 0,
    totalRevenue: 0,
    pendingCommission: 0,
    joinedAt:
      (doc.createdAt as any)?.toDate?.()?.toISOString?.()?.slice(0, 10) ??
      (typeof doc.createdAt === 'string' && doc.createdAt ? doc.createdAt.slice(0, 10) : ''),
    razonSocial: doc.razonSocial ? String(doc.razonSocial) : undefined,
    cuit: doc.cuit ? String(doc.cuit) : undefined,
    minOrder: doc.minOrder ? Number(doc.minOrder) : doc.minimumOrder ? Number(doc.minimumOrder) : undefined,
    deliveryTimeLabel: doc.deliveryTimeLabel ? String(doc.deliveryTimeLabel) : undefined,
    deliveryHours: doc.deliveryHours ? String(doc.deliveryHours) : undefined,
    commissionRate: doc.commissionRate ? Number(doc.commissionRate) : undefined,
  }
}

function fsToCommerce(doc: Record<string, unknown> & { id: string }): AdminCommerce {
  const rawCreatedAt = doc.createdAt
  const joinedAt =
    (rawCreatedAt as any)?.toDate?.()?.toISOString?.()?.slice(0, 10) ??
    (typeof rawCreatedAt === 'string' && rawCreatedAt ? rawCreatedAt.slice(0, 10) : '')
  return {
    id: doc.id,
    businessName: String(doc.businessName ?? doc.storeName ?? ''),
    email: String(doc.email ?? ''),
    phone: String(doc.phone ?? ''),
    address: String(doc.address ?? ''),
    city: String(doc.city ?? (doc.location as any)?.city ?? ''),
    status: (doc.status as AdminCommerce['status']) ?? 'active',
    totalOrders: 0,
    totalSpent: 0,
    joinedAt,
    razonSocial: doc.razonSocial ? String(doc.razonSocial) : undefined,
    cuit: doc.cuit ? String(doc.cuit) : undefined,
  }
}

function fsToOrder(doc: Record<string, unknown> & { id: string }): AdminOrder {
  const items = Array.isArray(doc.items) ? doc.items : []
  const rawCreatedAt = doc.createdAt
  const createdAt =
    (rawCreatedAt as any)?.toDate?.()?.toISOString?.() ??
    (typeof rawCreatedAt === 'string' && rawCreatedAt ? rawCreatedAt : new Date().toISOString())
  return {
    id: doc.id,
    orderNumber: doc.id.slice(0, 8).toUpperCase(),
    commerceName: String(doc.commerceName ?? doc.commerceId ?? ''),
    distributorName: String(doc.distributorName ?? doc.distributorId ?? ''),
    total: Number(doc.total ?? 0),
    paymentMethod: (doc.paymentMethod as AdminOrder['paymentMethod']) ?? 'external',
    orderStatus: (doc.orderStatus as AdminOrder['orderStatus']) ?? 'pending_confirmation',
    createdAt,
    itemCount: items.length,
  }
}

function fsToCommission(doc: Record<string, unknown> & { id: string }): AdminCommission {
  const orderId = String(doc.orderId ?? '')
  return {
    id: doc.id,
    distributorId: String(doc.distributorId ?? ''),
    distributorName: String(doc.distributorName ?? doc.distributorId ?? ''),
    period: String(doc.period ?? ''),
    orderTotal: Number(doc.orderTotal ?? 0),
    commissionRate: Number(doc.commissionRate ?? 0.015),
    commissionAmount: Number(doc.commissionAmount ?? 0),
    status: (doc.status as AdminCommission['status']) ?? 'pending',
    orderId,
    orderNumber: doc.orderNumber ? String(doc.orderNumber) : orderId.slice(0, 8).toUpperCase(),
    createdAt: (doc.createdAt as any)?.toDate?.()?.toISOString() ?? new Date().toISOString(),
  }
}

function fsToCategory(doc: Record<string, unknown> & { id: string }): AdminCategory {
  return {
    id: doc.id,
    name: String(doc.name ?? ''),
    rubric: String(doc.rubric ?? 'General'),
    iconName: String(doc.iconName ?? 'Tag'),
    visible: doc.visible !== false,
    order: Number(doc.order ?? 99),
    distributorCount: Number(doc.distributorCount ?? 0),
  }
}

function fsToReview(doc: Record<string, unknown> & { id: string }): AdminReview {
  return {
    id: doc.id,
    distributorName: String(doc.distributorName ?? doc.distributorId ?? ''),
    commerceName: String(doc.commerceName ?? doc.commerceId ?? ''),
    rating: Number(doc.ratingGeneral ?? doc.rating ?? 0),
    comment: String(doc.comment ?? ''),
    createdAt: doc.createdAt ? String(doc.createdAt) : new Date().toISOString(),
    visible: doc.visible !== false,
  }
}

// ─── Read functions (Firestore-first, mock fallback) ─────────────────────────

export async function getAdminDistributors(): Promise<AdminDistributor[]> {
  try {
    const [docs, userDocs] = await Promise.all([
      getCollection<Record<string, unknown>>(COLLECTIONS.distributors),
      getCollection<Record<string, unknown>>(COLLECTIONS.users),
    ])
    if (docs.length > 0) {
      const emailByUid: Record<string, string> = {}
      userDocs.forEach(u => { emailByUid[u.id] = String(u.email ?? '') })
      return docs.map(doc => {
        const base = fsToDistributor(doc)
        return { ...base, email: base.email || emailByUid[doc.id] || '' }
      })
    }
  } catch { /* fall through */ }
  return MOCK_DISTRIBUTORS
}

export async function getAdminCommerces(): Promise<AdminCommerce[]> {
  try {
    const [docs, userDocs] = await Promise.all([
      getCollection<Record<string, unknown>>(COLLECTIONS.commerces),
      getCollection<Record<string, unknown>>(COLLECTIONS.users),
    ])
    if (docs.length > 0) {
      const emailByUid: Record<string, string> = {}
      userDocs.forEach(u => { emailByUid[u.id] = String(u.email ?? '') })
      return docs.map(doc => {
        const base = fsToCommerce(doc)
        return { ...base, email: base.email || emailByUid[doc.id] || '' }
      })
    }
  } catch { /* fall through */ }
  return MOCK_COMMERCES
}

export async function getAdminDistributorById(id: string): Promise<AdminDistributor | null> {
  try {
    const [distDoc, userDoc, orderDocs, commDocs] = await Promise.all([
      getDocument<Record<string, unknown>>(COLLECTIONS.distributors, id),
      getDocument<Record<string, unknown>>(COLLECTIONS.users, id),
      getDocumentsByField<Record<string, unknown>>(COLLECTIONS.orders, 'distributorId', '==', id),
      getDocumentsByField<Record<string, unknown>>(COLLECTIONS.commissions, 'distributorId', '==', id),
    ])
    if (distDoc) {
      const base = fsToDistributor(distDoc)
      const email = base.email || String(userDoc?.email ?? '')
      const totalOrders = orderDocs.length
      const totalRevenue = orderDocs.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
      const pendingCommission = commDocs
        .filter(c => c.status === 'pending' || c.status === 'overdue')
        .reduce((sum, c) => sum + Number(c.commissionAmount ?? 0), 0)
      return { ...base, email, totalOrders, totalRevenue, pendingCommission }
    }
  } catch { /* fall through */ }
  return MOCK_DISTRIBUTORS.find(d => d.id === id) ?? null
}

export async function getAdminCommerceById(id: string): Promise<AdminCommerce | null> {
  try {
    const [commDoc, userDoc, orderDocs] = await Promise.all([
      getDocument<Record<string, unknown>>(COLLECTIONS.commerces, id),
      getDocument<Record<string, unknown>>(COLLECTIONS.users, id),
      getDocumentsByField<Record<string, unknown>>(COLLECTIONS.orders, 'commerceId', '==', id),
    ])
    if (commDoc) {
      const base = fsToCommerce(commDoc)
      const email = base.email || String(userDoc?.email ?? '')
      const totalOrders = orderDocs.length
      const totalSpent = orderDocs.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
      return { ...base, email, totalOrders, totalSpent }
    }
  } catch { /* fall through */ }
  return MOCK_COMMERCES.find(c => c.id === id) ?? null
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  try {
    const [orderDocs, distDocs, commDocs] = await Promise.all([
      getCollection<Record<string, unknown>>(COLLECTIONS.orders),
      getCollection<Record<string, unknown>>(COLLECTIONS.distributors),
      getCollection<Record<string, unknown>>(COLLECTIONS.commerces),
    ])
    if (orderDocs.length > 0) {
      const distNames: Record<string, string> = {}
      distDocs.forEach(d => { distNames[d.id] = String(d.companyName ?? '') })
      const commerceNames: Record<string, string> = {}
      commDocs.forEach(c => { commerceNames[c.id] = String(c.businessName ?? c.storeName ?? '') })
      return orderDocs.map(doc => ({
        ...fsToOrder(doc),
        commerceName:    commerceNames[String(doc.commerceId)]   || String(doc.commerceId ?? ''),
        distributorName: distNames[String(doc.distributorId)]    || String(doc.distributorId ?? ''),
      }))
    }
  } catch { /* fall through */ }
  return MOCK_ORDERS
}

export async function getAdminCommissions(): Promise<AdminCommission[]> {
  try {
    const commDocs = await getCollection<Record<string, unknown>>(COLLECTIONS.commissions)
    if (commDocs.length > 0) {
      return commDocs
        .map(fsToCommission)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  } catch { /* fall through */ }
  return MOCK_COMMISSIONS
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  try {
    const [catDocs, distDocs] = await Promise.all([
      getCollection<Record<string, unknown>>(COLLECTIONS.categories),
      getCollection<Record<string, unknown>>(COLLECTIONS.distributors),
    ])
    if (catDocs.length > 0) {
      const countByName: Record<string, number> = {}
      distDocs.forEach(d => {
        const cats = Array.isArray(d.categories) ? (d.categories as string[]) : []
        cats.forEach(cat => { countByName[cat] = (countByName[cat] ?? 0) + 1 })
      })
      return catDocs
        .map(doc => ({ ...fsToCategory(doc), distributorCount: countByName[String(doc.name ?? '')] ?? 0 }))
        .sort((a, b) => a.order - b.order)
    }
  } catch { /* fall through */ }
  return MOCK_CATEGORIES
}

export async function getAdminReviews(): Promise<AdminReview[]> {
  try {
    const docs = await getCollection<Record<string, unknown>>(COLLECTIONS.reviews)
    if (docs.length > 0) return docs.map(fsToReview)
  } catch { /* fall through */ }
  return MOCK_REVIEWS
}

// ─── Write actions ────────────────────────────────────────────────────────────

export async function adminSetDistributorStatus(
  id: string,
  status: 'active' | 'paused' | 'review'
): Promise<void> {
  await updateDocument(COLLECTIONS.distributors, id, { status })
}

export async function adminSetCommerceStatus(
  id: string,
  status: 'active' | 'review' | 'blocked'
): Promise<void> {
  await updateDocument(COLLECTIONS.commerces, id, { status })
}

export async function adminMarkCommissionPaid(id: string): Promise<void> {
  await updateDocument(COLLECTIONS.commissions, id, { status: 'paid', paidAt: new Date().toISOString() })
}

export async function adminRevertCommission(id: string): Promise<void> {
  await updateDocument(COLLECTIONS.commissions, id, { status: 'pending' })
}

export async function adminWaiveCommission(id: string): Promise<void> {
  await updateDocument(COLLECTIONS.commissions, id, { status: 'waived' })
}

export async function adminSetDistributorCommissionStatus(
  distributorId: string,
  status: 'ok' | 'overdue' | 'blocked'
): Promise<void> {
  await updateDocument(COLLECTIONS.distributors, distributorId, { commissionStatus: status })
}

export async function adminSetDistributorCommissionRate(
  distributorId: string,
  rate: number
): Promise<void> {
  await updateDocument(COLLECTIONS.distributors, distributorId, { commissionRate: rate })
}

export async function adminSetCategoryVisibility(id: string, visible: boolean): Promise<void> {
  await updateDocument(COLLECTIONS.categories, id, { visible })
}

export async function adminCreateCategory(data: {
  name: string; rubric: string; iconName?: string; order?: number
}): Promise<string> {
  return createDocument(COLLECTIONS.categories, {
    name: data.name,
    rubric: data.rubric,
    iconName: data.iconName ?? 'Tag',
    visible: true,
    order: data.order ?? 99,
    distributorCount: 0,
  })
}

export async function adminModerateReview(id: string, visible: boolean): Promise<void> {
  await updateDocument(COLLECTIONS.reviews, id, { visible })
}

// ─── Dashboard stats ──────────────────────────────────────────────────────────

export async function getAdminDashboardStats() {
  const currentPeriod = new Date().toISOString().slice(0, 7) // "YYYY-MM"

  const [distributors, commerces, orders, commissions] = await Promise.all([
    getAdminDistributors(),
    getAdminCommerces(),
    getAdminOrders(),
    getAdminCommissions(),
  ])

  // Filter orders to current calendar month
  const monthOrders = orders.filter(o => o.createdAt.slice(0, 7) === currentPeriod)

  return {
    activeDistributors:  distributors.filter(d => d.status === 'active').length,
    activeCommerces:     commerces.filter(c => c.status === 'active').length,
    monthOrders:         monthOrders.length,
    pendingCommissions:  commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0),
    overdueCommissions:  commissions.filter(c => c.status === 'overdue').reduce((s, c) => s + c.commissionAmount, 0),
    totalRevenue:        monthOrders.filter(o => o.orderStatus === 'delivered').reduce((s, o) => s + o.total, 0),
    cancelledOrders:     monthOrders.filter(o => o.orderStatus === 'cancelled' || o.orderStatus === 'not_delivered').length,
    pausedDistributors:  distributors.filter(d => d.status === 'paused'),
    overdueDistributors: [...new Set(commissions.filter(c => c.status === 'overdue').map(c => c.distributorName))],
  }
}

// ─── Seed / restore standard categories ──────────────────────────────────────

const STANDARD_CATEGORIES = [
  { id: 'cat-1',  name: 'Bebidas',            iconName: 'GlassWater',      image: '/categorias/01_bebidas.png',          rubric: 'Alimentos y Bebidas', order: 1,  visible: true },
  { id: 'cat-2',  name: 'Almacén',            iconName: 'ShoppingBasket',  image: '/categorias/02_almacen.png',          rubric: 'Alimentos y Bebidas', order: 2,  visible: true },
  { id: 'cat-3',  name: 'Lácteos',            iconName: 'Milk',            image: '/categorias/04_lacteos.png',          rubric: 'Alimentos y Bebidas', order: 3,  visible: true },
  { id: 'cat-4',  name: 'Panadería',          iconName: 'Croissant',       image: '/categorias/05_panaderia.png',        rubric: 'Alimentos y Bebidas', order: 4,  visible: true },
  { id: 'cat-5',  name: 'Snacks',             iconName: 'Cookie',          image: '/categorias/06_snacks.png',           rubric: 'Alimentos y Bebidas', order: 5,  visible: true },
  { id: 'cat-6',  name: 'Fiambres',           iconName: 'UtensilsCrossed', image: '/categorias/07_fiambres.png',         rubric: 'Alimentos y Bebidas', order: 6,  visible: true },
  { id: 'cat-7',  name: 'Congelados',         iconName: 'Snowflake',       image: '/categorias/08_congelados.png',       rubric: 'Alimentos y Bebidas', order: 7,  visible: true },
  { id: 'cat-8',  name: 'Golosinas y Kiosco', iconName: 'Cookie',          image: '/categorias/09_golosinas_kiosco.png', rubric: 'Alimentos y Bebidas', order: 8,  visible: true },
  { id: 'cat-9',  name: 'Limpieza',           iconName: 'Sparkles',        image: '/categorias/03_limpieza.png',         rubric: 'Limpieza e Higiene',  order: 9,  visible: true },
  { id: 'cat-10', name: 'Perfumería',         iconName: 'Sparkles',        image: '/categorias/10_perfumeria.png',       rubric: 'Limpieza e Higiene',  order: 10, visible: true },
  { id: 'cat-11', name: 'Mascotas',           iconName: 'Package',         image: '/categorias/11_mascotas.png',         rubric: 'Otros',               order: 11, visible: true },
  { id: 'cat-12', name: 'Otros',              iconName: 'Package',         image: '/categorias/12_otros.png',            rubric: 'Otros',               order: 12, visible: true },
]

export async function adminRestoreStandardCategories(): Promise<{ seeded: number; deleted: number }> {
  const standardIds   = new Set(STANDARD_CATEGORIES.map(c => c.id))
  const standardNames = new Set(STANDARD_CATEGORIES.map(c => c.name))

  // Get current state
  const existing = await getCollection<Record<string, unknown>>(COLLECTIONS.categories)

  // Delete docs that are NOT one of the 12 standard (by id OR by name)
  const toDelete = existing.filter(d => !standardIds.has(d.id) && !standardNames.has(String(d.name ?? '')))
  await Promise.all(toDelete.map(d => deleteDocument(COLLECTIONS.categories, d.id)))

  // Upsert all 12 standard categories (overwrites to guarantee clean state)
  await Promise.all(
    STANDARD_CATEGORIES.map(cat =>
      setDocument(COLLECTIONS.categories, cat.id, {
        name:     cat.name,
        iconName: cat.iconName,
        image:    cat.image,
        rubric:   cat.rubric,
        order:    cat.order,
        visible:  cat.visible,
      })
    )
  )

  return { seeded: STANDARD_CATEGORIES.length, deleted: toDelete.length }
}
