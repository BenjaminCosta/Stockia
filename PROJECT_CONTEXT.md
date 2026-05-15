# Stockia PWA — Contexto del Proyecto

## Stack técnico
- **Next.js 16.2.4** (App Router, Turbopack), `'use client'` en todas las páginas interactivas
- **Firebase** v12: Auth (email/password), Firestore (onSnapshot real-time), reglas en `firestore.rules`
- **Tailwind CSS** — identidad: `#0B1A45` (navy/`bg-sidebar`), `#C8FF00` (lima/`bg-lima`), `#F4F5F7` (fondo)
- **xlsx** v0.18.5 — import/export productos

---

## Arquitectura de datos

### Roles de usuario
```
comercio | distribuidora | admin
```
Guardado en colección `users/{uid}.role`. El middleware (`middleware.ts`) redirige según rol usando cookies `stockia-session` y `stockia-role`. El `AuthGuard` (`components/auth-guard.tsx`) protege client-side.

### Colecciones Firestore
| Colección | Descripción |
|---|---|
| `users` | Datos de autenticación y rol |
| `commerces` | Perfil de cada comercio |
| `distributors` | Perfil de cada distribuidora |
| `products` | Catálogo de productos por distribuidora |
| `categories` | Categorías de productos (admin) |
| `orders` | Pedidos (7 estados) |
| `commissions` | Comisiones generadas al entregar |
| `reviews` | Reseñas de comercios a distribuidoras |
| `adminSettings` | Configuración global |

### Modelo Order — 7 estados Firestore
```
pending_confirmation → confirmed → preparing → ready_or_on_the_way → delivered
                    ↘ cancelled
                    ↘ not_delivered (desde confirmed/preparing/ready)
```
- `paymentMethod`: `'mercado_pago' | 'external'`
- `cancellationReason`: string (cuando cancelled/not_delivered)
- `commissionGenerated`: boolean — se setea true al generar comisión
- `commissionAmount`: number — 1.5% del total
- Comisión se crea en colección `commissions` cuando distribuidor marca `delivered`

### Fallback pattern
Todos los servicios intentan Firestore primero y caen a mock data si falla:
```typescript
try {
  const docs = await getDocumentsByField(...)
  if (docs.length > 0) return docs.map(transform)
} catch { /* fall through */ }
return mockData
```

---

## Estructura de archivos clave

### Páginas
```
app/
├── (auth)/
│   ├── login/          — Firebase email/password login
│   ├── registro/       — Registro comercio o distribuidora
│   └── comercio/onboarding, distribuidora/onboarding
├── comercio/
│   ├── page.tsx        — Dashboard comercio
│   ├── distribuidoras/ — Lista distribuidoras con filtros
│   ├── distribuidora/[id]/ — Perfil + catálogo + reseñas
│   ├── buscar/         — Búsqueda global de productos
│   ├── carrito/        — Carrito de compras
│   ├── checkout/       — Confirmar pedido + selección método de pago
│   ├── pedidos/        — Lista de pedidos
│   ├── pedidos/[id]/   — Detalle + timeline + contacto distribuidora
│   ├── pedidos/calificar/[orderId]/ — Formulario de reseña
│   ├── producto/[id]/  — Detalle de producto
│   └── cuenta/         — Perfil + notificaciones + logout
├── distribuidora/
│   ├── page.tsx        — Dashboard con KPIs + últimos pedidos + stock bajo
│   ├── pedidos/        — Lista con Aceptar/Rechazar rápido
│   ├── pedidos/[id]/   — Detalle completo con 7 estados + modal cancelación
│   ├── productos/      — Catálogo + Importar/Exportar/Plantilla
│   ├── productos/[id]/ — Editar producto
│   ├── productos/nuevo/ — Nuevo producto
│   ├── ventas/         — Métricas, KPIs, top productos
│   ├── zonas/          — Configuración de zonas + save a Firestore
│   ├── resenas/        — Reseñas recibidas + historial de comercios
│   └── perfil/         — Info + notificaciones + logout
└── admin/
    ├── page.tsx        — Dashboard admin con KPIs globales
    ├── distribuidoras/ — CRUD estado distribuidoras
    ├── comercios/      — CRUD estado comercios
    ├── pedidos/        — Vista global todos los pedidos + filtros
    ├── comisiones/     — Gestión comisiones + marcar pagadas
    ├── categorias/     — CRUD categorías
    └── ratings/        — Moderación reseñas (ocultar/mostrar)
```

### Servicios (lib/data/)
```
products.service.ts   — CRUD productos
orders.service.ts     — createOrder, updateOrderStatus, generateCommission
distributors.service.ts — getDistributors, upsertDistributor, updateStatus
users.service.ts      — getUserProfile
categories.service.ts — getCategories
commissions.service.ts — getCommissions
reviews.service.ts    — createReview, getReviews, moderateReview, getCommerceHistory
admin.service.ts      — todas las operaciones del panel admin
```

### Hooks (hooks/use-data.ts)
```typescript
useDistributors(location?)      // lista de distribuidoras para comercio
useDistributor(id)              // distribuidora individual — guarda id vacío
useProducts(distributorId?)     // productos de una distribuidora
useComercioOrders(comercioId)   // pedidos del comercio (onSnapshot)
useDistribuidoraOrders(distId)  // pedidos de la distribuidora (onSnapshot)
useOrder(id)                    // pedido individual (onSnapshot)
```

### Componentes clave
```
components/
├── status-badge.tsx          — Badge para 7 estados Firestore + 4 locales
├── star-rating.tsx           — StarDisplay, StarPicker, RatingBadge, CriteriaRow
├── review-card.tsx           — Tarjeta de reseña con criterios
├── distribuidora-sidebar.tsx — Sidebar nav con reseñas
├── distribuidora-bottom-nav.tsx — Nav mobile 5 items
├── admin-sidebar.tsx         — Sidebar admin
├── stockia-logo.tsx          — Logo variant: 'navy' | 'white' | 'icon'
├── products/
│   └── ImportProductsModal.tsx — Modal import con drag&drop + preview + validación
└── ui/ (SearchInput, PillFilter, EmptyState, InitialsAvatar, SkeletonCard, LoadingButton, ...)
```

---

## Import/Export productos (lib/import/, lib/export/)

### Columnas del Excel
`nombre | categoria | marca | sku | descripcion | precio | stock | unidad | estado`

**Validaciones:**
- `nombre` requerido
- `categoria` requerida
- `precio` ≥ 0
- `stock` ≥ 0
- `estado` en `['active', 'paused', 'out_of_stock']` — default `active`; si stock=0 sugiere `out_of_stock`

**Funciones:**
- `parseProductsFile(file)` → `{ rows, totalErrors }`
- `exportProductsToXlsx(products, filename?)` — descarga xlsx
- `downloadTemplate()` — descarga plantilla con 2 filas de ejemplo

---

## Sistema de reseñas

### Flujo
1. Comercio hace pedido → se entrega → aparece CTA "Calificar" en detalle del pedido
2. Formulario: rating general (1-5) + 4 criterios + comentario opcional
3. Distribuidora ve sus reseñas en `/distribuidora/resenas`
4. Admin modera en `/admin/ratings` (ocultar/mostrar)

### Tipos
```typescript
Review { ratingGeneral, ratingFulfillment, ratingDelivery, ratingProductCondition, ratingCommunication, comment, status: 'visible'|'hidden'|'reported' }
DistributorRatingSummary { averageGeneral, averageFulfillment, ... reviewCount }
CommerceHistory { completedOrders, cancelledOrders, notDeliveredOrders, reportedIssues }
```

---

## Flujo de pago externo

- Comercio elige "Coordinar con distribuidora" en checkout
- Orden se crea con `paymentMethod: 'external'`, `orderStatus: 'pending_confirmation'`
- Distribuidora ve el pedido con badge "Coordinar" y puede Aceptar o Rechazar
- Al Aceptar → datos de contacto del comercio se habilitan en ambos lados
- Al marcar Entregado → se genera comisión 1.5% automáticamente

---

## Firestore Rules — resumen de permisos

| Colección | Comercio | Distribuidora | Admin |
|---|---|---|---|
| users | R/W propio | R/W propio | R full |
| commerces | R/W propio | R | R/W |
| distributors | R | R/W propio | R/W |
| products | R | R/W propios | R/W |
| categories | R | R | R/W |
| orders | R propio, C | R/U propios | R/W |
| commissions | — | R propio, C propio | R/W |
| reviews | R, C | R | R, delete |
| adminSettings | — | — | R/W |

---

## Estado de implementación

### ✅ Completo y funcionando
- Auth Firebase completa (login, registro, logout, middleware, AuthGuard)
- Flujo de pedidos con 7 estados (Firestore + fallback mock)
- Pago externo ("Coordinar con distribuidora") — checkout, confirmación, contact lock
- Sistema de reseñas completo (crear, ver, moderar)
- Import/Export productos por Excel/CSV
- Admin panel con write actions (pedidos, comisiones, ratings, categorías, comercios, distribuidoras)
- Dashboard distribuidora con KPIs y stock bajo real (de `useProducts`)
- Botones Aceptar/Rechazar en lista de pedidos conectados a `updateOrderStatus`
- Zonas de entrega: guardar en Firestore al presionar Save
- Comisiones: generación automática al marcar `delivered` (1.5%)
- Firestore rules completas para todos los collections

### ⚠️ Funcional como prototipo (sin backend real)
- Mercado Pago — UI lista, sin SDK/redirect real
- Notificaciones push — switches de UI, sin FCM conectado
- Upload de imágenes de productos — UI placeholder, sin Firebase Storage
- Mapa de zonas — radio en km guardado pero sin renderizado de mapa real

### 📁 Archivos no commiteados (en git status como modified/untracked)
Ver `git status` para lista completa. Todos los cambios están en working directory sin commitear desde el commit `29cd9af`.
