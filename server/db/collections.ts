import type { Collection } from 'mongodb'
import { getDB } from './mongodb'
import type {
  UserDoc,
  ProductDoc,
  OrderDoc,
  ReviewDoc,
  ReviewTokenDoc,
  DiscountCodeDoc,
} from './types'

/**
 * Type-safe collection accessors.
 * Always call getDB() lazily — DB must be connected before accessing collections.
 */
export function collections() {
  const db = getDB()
  return {
    users: db.collection<UserDoc>('users'),
    products: db.collection<ProductDoc>('products'),
    orders: db.collection<OrderDoc>('orders'),
    reviews: db.collection<ReviewDoc>('reviews'),
    reviewTokens: db.collection<ReviewTokenDoc>('reviewTokens'),
    discountCodes: db.collection<DiscountCodeDoc>('discountCodes'),
  }
}

// Named typed exports for direct use
export type Collections = ReturnType<typeof collections>
export type UsersCollection = Collection<UserDoc>
export type ProductsCollection = Collection<ProductDoc>
export type OrdersCollection = Collection<OrderDoc>
export type ReviewsCollection = Collection<ReviewDoc>
export type ReviewTokensCollection = Collection<ReviewTokenDoc>
export type DiscountCodesCollection = Collection<DiscountCodeDoc>
