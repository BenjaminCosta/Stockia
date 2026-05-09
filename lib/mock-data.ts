import { 
  Comercio, 
  Distribuidora, 
  Product, 
  Category, 
  DistributorCard, 
  Order,
  DashboardKPIs 
} from './types'

// Categories
export const categories: Category[] = [
  { id: '1', name: 'Bebidas', iconName: 'bottle' },
  { id: '2', name: 'Lácteos', iconName: 'milk' },
  { id: '3', name: 'Panadería', iconName: 'wheat' },
  { id: '4', name: 'Snacks', iconName: 'package' },
  { id: '5', name: 'Limpieza', iconName: 'sparkles' },
  { id: '6', name: 'Almacén', iconName: 'boxes' },
  { id: '7', name: 'Fiambres', iconName: 'badge' },
  { id: '8', name: 'Congelados', iconName: 'snowflake' },
]

// Mock Comercios
export const mockComercios: Comercio[] = [
  {
    id: 'com-1',
    email: 'almacen.don.pedro@email.com',
    role: 'comercio',
    storeName: 'Almacén Don Pedro',
    phone: '+54 11 4567-8901',
    address: 'Av. Mitre 1234',
    location: {
      lat: -34.6629,
      lng: -58.3659,
      city: 'Avellaneda',
      zone: 'Centro',
    },
    createdAt: '2024-01-15',
  },
  {
    id: 'com-2',
    email: 'kiosco.maria@email.com',
    role: 'comercio',
    storeName: 'Kiosco María',
    phone: '+54 11 4567-1234',
    address: 'Calle 9 de Julio 567',
    location: {
      lat: -34.7263,
      lng: -58.4063,
      city: 'Lanús',
      zone: 'Este',
    },
    createdAt: '2024-02-01',
  },
]

// Mock Distribuidoras
export const mockDistribuidoras: Distribuidora[] = [
  {
    id: 'dist-1',
    email: 'contacto@bebidassur.com',
    role: 'distribuidora',
    companyName: 'Bebidas del Sur',
    phone: '+54 11 4321-5678',
    address: 'Parque Industrial Quilmes',
    coverageRadiusKm: 25,
    location: {
      lat: -34.7223,
      lng: -58.2545,
      city: 'Quilmes',
    },
    createdAt: '2024-01-01',
  },
  {
    id: 'dist-2',
    email: 'ventas@lacteosfrescos.com',
    role: 'distribuidora',
    companyName: 'Lácteos Frescos SRL',
    phone: '+54 11 4321-8765',
    address: 'Av. Calchaquí 4500',
    coverageRadiusKm: 15,
    location: {
      lat: -34.7163,
      lng: -58.3063,
      city: 'Quilmes',
    },
    createdAt: '2024-01-10',
  },
  {
    id: 'dist-3',
    email: 'pedidos@panaderosunidos.com',
    role: 'distribuidora',
    companyName: 'Panaderos Unidos',
    phone: '+54 11 4567-9999',
    address: 'Calle Alsina 890',
    coverageRadiusKm: 10,
    location: {
      lat: -34.6629,
      lng: -58.3659,
      city: 'Avellaneda',
    },
    createdAt: '2024-01-20',
  },
  {
    id: 'dist-4',
    email: 'info@megadistribuidora.com',
    role: 'distribuidora',
    companyName: 'Mega Distribuidora',
    phone: '+54 11 5555-1234',
    address: 'Ruta 2 km 5',
    coverageRadiusKm: 30,
    location: {
      lat: -34.7563,
      lng: -58.3863,
      city: 'Lanús',
    },
    createdAt: '2024-02-01',
  },
]

// Distributor cards for comercio home
export const mockDistributorCards: DistributorCard[] = [
  {
    id: 'dist-1',
    companyName: 'Bebidas del Sur',
    initials: 'BS',
    distance: '3.2 km',
    deliveryInfo: 'Entrega en 24hs',
    minOrder: 15000,
    productCount: 156,
    categories: ['Bebidas', 'Snacks'],
  },
  {
    id: 'dist-2',
    companyName: 'Lácteos Frescos SRL',
    initials: 'LF',
    distance: '1.8 km',
    deliveryInfo: 'Entrega mismo día',
    minOrder: 8000,
    productCount: 89,
    categories: ['Lácteos', 'Fiambres'],
  },
  {
    id: 'dist-3',
    companyName: 'Panaderos Unidos',
    initials: 'PU',
    distance: '0.5 km',
    deliveryInfo: 'Entrega en 2hs',
    minOrder: 5000,
    productCount: 42,
    categories: ['Panadería'],
  },
  {
    id: 'dist-4',
    companyName: 'Mega Distribuidora',
    initials: 'MD',
    distance: '4.5 km',
    deliveryInfo: 'Entrega en 48hs',
    minOrder: 25000,
    productCount: 320,
    categories: ['Almacén', 'Limpieza', 'Bebidas'],
  },
]

// Products by distribuidora
export const mockProducts: Product[] = [
  // Bebidas del Sur products
  {
    id: 'prod-1',
    distribuidoraId: 'dist-1',
    name: 'Coca-Cola 2.25L',
    category: 'Bebidas',
    price: 1850,
    stock: 240,
    description: 'Gaseosa Coca-Cola botella 2.25 litros',
    active: true,
  },
  {
    id: 'prod-2',
    distribuidoraId: 'dist-1',
    name: 'Sprite 2.25L',
    category: 'Bebidas',
    price: 1750,
    stock: 180,
    description: 'Gaseosa Sprite botella 2.25 litros',
    active: true,
  },
  {
    id: 'prod-3',
    distribuidoraId: 'dist-1',
    name: 'Agua Mineral Villavicencio 1.5L',
    category: 'Bebidas',
    price: 980,
    stock: 320,
    description: 'Agua mineral sin gas 1.5 litros',
    active: true,
  },
  {
    id: 'prod-4',
    distribuidoraId: 'dist-1',
    name: 'Cerveza Quilmes 1L',
    category: 'Bebidas',
    price: 2100,
    stock: 150,
    description: 'Cerveza Quilmes retornable 1 litro',
    active: true,
  },
  {
    id: 'prod-5',
    distribuidoraId: 'dist-1',
    name: 'Papas Lays Clásicas 270g',
    category: 'Snacks',
    price: 2450,
    stock: 85,
    description: 'Papas fritas Lays sabor clásico',
    active: true,
  },
  // Lácteos Frescos products
  {
    id: 'prod-6',
    distribuidoraId: 'dist-2',
    name: 'Leche La Serenísima 1L',
    category: 'Lácteos',
    price: 1250,
    stock: 200,
    description: 'Leche entera La Serenísima sachet 1 litro',
    active: true,
  },
  {
    id: 'prod-7',
    distribuidoraId: 'dist-2',
    name: 'Yogur Activia Natural 190g',
    category: 'Lácteos',
    price: 890,
    stock: 120,
    description: 'Yogur Activia natural sin azúcar',
    active: true,
  },
  {
    id: 'prod-8',
    distribuidoraId: 'dist-2',
    name: 'Queso Cremoso Tregar 1kg',
    category: 'Lácteos',
    price: 8500,
    stock: 45,
    description: 'Queso cremoso Tregar por kilo',
    active: true,
  },
  {
    id: 'prod-9',
    distribuidoraId: 'dist-2',
    name: 'Jamón Cocido Paladini 200g',
    category: 'Fiambres',
    price: 3200,
    stock: 60,
    description: 'Jamón cocido Paladini feteado',
    active: true,
  },
  {
    id: 'prod-10',
    distribuidoraId: 'dist-2',
    name: 'Manteca La Serenísima 200g',
    category: 'Lácteos',
    price: 2100,
    stock: 80,
    description: 'Manteca La Serenísima pan 200g',
    active: true,
  },
  // Panaderos Unidos products
  {
    id: 'prod-11',
    distribuidoraId: 'dist-3',
    name: 'Pan Francés (docena)',
    category: 'Panadería',
    price: 1200,
    stock: 100,
    description: 'Pan francés fresco, docena',
    active: true,
  },
  {
    id: 'prod-12',
    distribuidoraId: 'dist-3',
    name: 'Medialunas (docena)',
    category: 'Panadería',
    price: 2800,
    stock: 50,
    description: 'Medialunas de manteca, docena',
    active: true,
  },
  {
    id: 'prod-13',
    distribuidoraId: 'dist-3',
    name: 'Pan Lactal Bimbo 500g',
    category: 'Panadería',
    price: 1650,
    stock: 75,
    description: 'Pan lactal blanco Bimbo',
    active: true,
  },
  {
    id: 'prod-14',
    distribuidoraId: 'dist-3',
    name: 'Facturas Surtidas (docena)',
    category: 'Panadería',
    price: 3500,
    stock: 30,
    description: 'Facturas surtidas frescas',
    active: true,
  },
  // Mega Distribuidora products
  {
    id: 'prod-15',
    distribuidoraId: 'dist-4',
    name: 'Arroz Gallo Oro 1kg',
    category: 'Almacén',
    price: 1450,
    stock: 200,
    description: 'Arroz largo fino Gallo Oro',
    active: true,
  },
  {
    id: 'prod-16',
    distribuidoraId: 'dist-4',
    name: 'Fideos Matarazzo 500g',
    category: 'Almacén',
    price: 980,
    stock: 180,
    description: 'Fideos spaghetti Matarazzo',
    active: true,
  },
  {
    id: 'prod-17',
    distribuidoraId: 'dist-4',
    name: 'Lavandina Ayudín 2L',
    category: 'Limpieza',
    price: 1100,
    stock: 120,
    description: 'Lavandina concentrada Ayudín',
    active: true,
  },
  {
    id: 'prod-18',
    distribuidoraId: 'dist-4',
    name: 'Detergente Magistral 750ml',
    category: 'Limpieza',
    price: 1850,
    stock: 90,
    description: 'Detergente Magistral multiuso',
    active: true,
  },
  {
    id: 'prod-19',
    distribuidoraId: 'dist-4',
    name: 'Aceite Cocinero 1.5L',
    category: 'Almacén',
    price: 2200,
    stock: 150,
    description: 'Aceite de girasol Cocinero',
    active: true,
  },
  {
    id: 'prod-20',
    distribuidoraId: 'dist-4',
    name: 'Azúcar Ledesma 1kg',
    category: 'Almacén',
    price: 1050,
    stock: 220,
    description: 'Azúcar blanca Ledesma',
    active: true,
  },
]

// Mock orders
export const mockOrders: Order[] = [
  {
    id: 'order-1',
    orderNumber: 'STK-2024-001',
    comercioId: 'com-1',
    comercioName: 'Almacén Don Pedro',
    distribuidoraId: 'dist-1',
    distribuidoraName: 'Bebidas del Sur',
    items: [
      { productId: 'prod-1', productName: 'Coca-Cola 2.25L', quantity: 24, unitPrice: 1850 },
      { productId: 'prod-2', productName: 'Sprite 2.25L', quantity: 12, unitPrice: 1750 },
      { productId: 'prod-3', productName: 'Agua Mineral Villavicencio 1.5L', quantity: 36, unitPrice: 980 },
    ],
    subtotal: 100680,
    total: 100680,
    status: 'entregado',
    createdAt: '2024-03-10T14:30:00',
    updatedAt: '2024-03-11T10:00:00',
    zone: 'Centro',
  },
  {
    id: 'order-2',
    orderNumber: 'STK-2024-002',
    comercioId: 'com-1',
    comercioName: 'Almacén Don Pedro',
    distribuidoraId: 'dist-2',
    distribuidoraName: 'Lácteos Frescos SRL',
    items: [
      { productId: 'prod-6', productName: 'Leche La Serenísima 1L', quantity: 48, unitPrice: 1250 },
      { productId: 'prod-8', productName: 'Queso Cremoso Tregar 1kg', quantity: 5, unitPrice: 8500 },
    ],
    subtotal: 102500,
    total: 102500,
    status: 'en_preparacion',
    createdAt: '2024-03-12T09:15:00',
    updatedAt: '2024-03-12T11:30:00',
    zone: 'Centro',
  },
  {
    id: 'order-3',
    orderNumber: 'STK-2024-003',
    comercioId: 'com-2',
    comercioName: 'Kiosco María',
    distribuidoraId: 'dist-3',
    distribuidoraName: 'Panaderos Unidos',
    items: [
      { productId: 'prod-11', productName: 'Pan Francés (docena)', quantity: 10, unitPrice: 1200 },
      { productId: 'prod-12', productName: 'Medialunas (docena)', quantity: 5, unitPrice: 2800 },
    ],
    subtotal: 26000,
    total: 26000,
    status: 'pagado',
    createdAt: '2024-03-12T08:00:00',
    updatedAt: '2024-03-12T08:30:00',
    zone: 'Este',
  },
  {
    id: 'order-4',
    orderNumber: 'STK-2024-004',
    comercioId: 'com-1',
    comercioName: 'Almacén Don Pedro',
    distribuidoraId: 'dist-4',
    distribuidoraName: 'Mega Distribuidora',
    items: [
      { productId: 'prod-15', productName: 'Arroz Gallo Oro 1kg', quantity: 20, unitPrice: 1450 },
      { productId: 'prod-16', productName: 'Fideos Matarazzo 500g', quantity: 30, unitPrice: 980 },
      { productId: 'prod-19', productName: 'Aceite Cocinero 1.5L', quantity: 12, unitPrice: 2200 },
    ],
    subtotal: 84800,
    total: 84800,
    status: 'pendiente',
    createdAt: '2024-03-12T16:45:00',
    updatedAt: '2024-03-12T16:45:00',
    zone: 'Centro',
  },
]

// Dashboard KPIs for distribuidora
export const mockDashboardKPIs: DashboardKPIs = {
  ventasHoy: 187500,
  pedidosHoy: 8,
  pendientes: 3,
  stockOk: 94,
}

// Helper functions
export function getProductsByDistribuidora(distribuidoraId: string): Product[] {
  return mockProducts.filter(p => p.distribuidoraId === distribuidoraId)
}

export function getOrdersByComercio(comercioId: string): Order[] {
  return mockOrders.filter(o => o.comercioId === comercioId)
}

export function getOrdersByDistribuidora(distribuidoraId: string): Order[] {
  return mockOrders.filter(o => o.distribuidoraId === distribuidoraId)
}

export function getDistribuidoraById(id: string): Distribuidora | undefined {
  return mockDistribuidoras.find(d => d.id === id)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pendiente: 'Pendiente',
    pagado: 'Pagado',
    en_preparacion: 'En preparación',
    entregado: 'Entregado',
  }
  return labels[status] || status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pendiente: 'bg-warning/10 text-warning',
    pagado: 'bg-info/10 text-info',
    en_preparacion: 'bg-primary/10 text-primary',
    entregado: 'bg-success/10 text-success',
  }
  return colors[status] || 'bg-muted text-muted-foreground'
}
