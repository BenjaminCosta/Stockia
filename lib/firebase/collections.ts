// Centralized Firestore collection names.
// Always reference these constants — never hardcode collection strings.

export const COLLECTIONS = {
  users: 'users',
  commerces: 'commerces',
  distributors: 'distributors',
  products: 'products',
  orders: 'orders',
  categories: 'categories',
  commissions: 'commissions',
  reviews: 'reviews',
  adminSettings: 'adminSettings',
} as const

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS]
