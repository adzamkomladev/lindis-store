import type { ObjectId } from 'mongodb'

// ─────────────────────────────────────────────────────────────────────────────
// users — merged with accounts table (1:1 Embed pattern)
// "User is always accessed with their auth credentials"
// ─────────────────────────────────────────────────────────────────────────────
export interface UserDoc {
  _id?: ObjectId
  email: string
  name?: string
  role: 'admin' | 'customer'
  credentials: {                                     // EMBEDDED (was accounts table)
    provider: string                                 // 'local' | 'google'
    passwordHash?: string
    providerAccountId?: string
  }[]
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// products — Computed (reviewStats) + Polymorphic (type) patterns
// ─────────────────────────────────────────────────────────────────────────────
export interface ProductSpecs {
  material?: string
  capacity?: string
  dimensions?: string
  weight?: string
  insulation?: string
  tempRetention?: string
}

export interface ProductDoc {
  _id?: ObjectId
  name: string
  slug: string                                       // unique index
  description?: string
  price: number                                      // pesewas (integer)
  currency: string                                   // 'GHS'
  inventoryCount: number
  images: string[]                                   // R2 public URLs
  status: 'draft' | 'active' | 'archived'
  isFeatured: boolean
  category: string                                   // kitchen category slug

  // POLYMORPHIC — extensible for future auction items
  type: 'standard' | 'auction'

  specs: ProductSpecs

  // COMPUTED PATTERN — pre-calculated on every review submission
  // Eliminates aggregation queries on product pages
  reviewStats: {
    averageRating: number
    totalCount: number
  }

  // Auction-specific fields (only present when type === 'auction')
  auctionDetails?: {
    startingBid: number
    reservePrice?: number
    bidIncrement: number
    startTime: Date
    endTime: Date
    currentBid?: number
    currentBidderId?: ObjectId
    bidCount: number
  }

  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// orders — merged with orderItems + payments (1:Few Embed + Extended Reference)
// "Order is always accessed as a complete unit"
// ─────────────────────────────────────────────────────────────────────────────
export interface OrderItemDoc {
  productId: ObjectId
  productName: string                                // SNAPSHOT at purchase time
  productSlug: string                                // SNAPSHOT
  productImages: string[]                            // SNAPSHOT
  quantity: number
  priceAtPurchase: number                            // Locked price in pesewas
  customText?: string
  review?: {                                         // EMBEDDED review per item
    rating: number
    title?: string
    comment?: string
    createdAt: Date
  }
}

export interface OrderDoc {
  _id?: ObjectId
  orderNumber: string                                // unique index, prefix "ls-"
  guestEmail: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  subtotal: number                                   // pesewas
  discountAmount: number                             // pesewas
  total: number                                      // pesewas

  // EMBEDDED — discount snapshot (was FK to discountCodes)
  discount: {
    code: string
    type: 'percentage' | 'fixed' | 'free_shipping'
    value: number
  } | null

  // EMBEDDED 1:Few (bounded 1-50) — was separate orderItems table
  // EXTENDED REFERENCE — product name/slug/images preserved at purchase
  items: OrderItemDoc[]

  // EMBEDDED 1:1 — was separate payments table
  payment: {
    reference: string                                // Paystack reference
    provider: string
    amount: number
    status: 'pending' | 'success' | 'failed'
    metadata?: Record<string, unknown>
    processedAt?: Date
  }

  shippingDetails: {
    name: string
    phone: string
    address: string
    city: string
  }

  createdAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// reviews — kept separate (1:Many Reference — unbounded per product, paginated)
// ─────────────────────────────────────────────────────────────────────────────
export interface ReviewDoc {
  _id?: ObjectId
  productId: ObjectId                                // index
  orderId: ObjectId
  orderNumber: string                                // DENORMALIZED for display
  customerEmail: string
  customerName: string
  rating: number                                     // 1-5
  title?: string
  comment?: string
  createdAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// reviewTokens — kept separate (lookup by token, TTL expiry)
// ─────────────────────────────────────────────────────────────────────────────
export interface ReviewTokenDoc {
  _id?: ObjectId
  orderId: ObjectId
  orderNumber: string                                // DENORMALIZED
  token: string                                      // unique index
  email: string
  items: {                                           // DENORMALIZED — snapshot for review form
    productId: ObjectId
    productName: string
    productImages: string[]
  }[]
  expiresAt: Date                                    // TTL index — auto-deleted
  usedAt?: Date
  createdAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// discountCodes — kept separate (admin CRUD, independent access patterns)
// ─────────────────────────────────────────────────────────────────────────────
export interface DiscountCodeDoc {
  _id?: ObjectId
  code: string                                       // unique index
  description?: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount?: number                            // pesewas
  minQuantity?: number
  maxUses?: number
  usedCount: number
  productId?: ObjectId                               // Optional: restrict to product
  categoryName?: string                              // Optional: restrict to category
  startsAt?: Date
  expiresAt?: Date
  isActive: boolean
  createdAt: Date
}

// ─────────────────────────────────────────────────────────────────────────────
// Input / helper types
// ─────────────────────────────────────────────────────────────────────────────
export type CreateProductInput = Omit<ProductDoc, '_id' | 'createdAt' | 'updatedAt' | 'reviewStats'>

export type UpdateProductInput = Partial<Omit<ProductDoc, '_id' | 'createdAt' | 'updatedAt'>>

export type CreateOrderInput = Omit<OrderDoc, '_id'>
