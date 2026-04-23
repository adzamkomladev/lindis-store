// Re-export MongoDB utilities for use in API routes
export { getDB, connectDB } from '~/server/db/mongodb'
export { collections } from '~/server/db/collections'
export type {
  UserDoc,
  ProductDoc,
  OrderDoc,
  OrderItemDoc,
  ReviewDoc,
  ReviewTokenDoc,
  DiscountCodeDoc,
  CreateProductInput,
  UpdateProductInput,
} from '~/server/db/types'
