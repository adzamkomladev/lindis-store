import type { Db } from 'mongodb'

/**
 * Create all MongoDB indexes for Lindi's Store.
 * Safe to run multiple times (createIndex is idempotent).
 */
export async function createIndexes(db: Db): Promise<void> {
  console.log('[MongoDB] Creating indexes...')

  // ── users ─────────────────────────────────────────────────────────────────
  const users = db.collection('users')
  await users.createIndex({ email: 1 }, { unique: true, name: 'users_email_unique' })

  // ── products ──────────────────────────────────────────────────────────────
  const products = db.collection('products')
  await products.createIndex({ slug: 1 }, { unique: true, name: 'products_slug_unique' })
  await products.createIndex(
    { status: 1, isFeatured: 1, createdAt: -1 },
    { name: 'products_status_featured_date' }
  )
  await products.createIndex(
    { category: 1, status: 1 },
    { name: 'products_category_status' }
  )
  await products.createIndex(
    { type: 1, status: 1 },
    { name: 'products_type_status' }
  )
  // Text search across name, description, category
  await products.createIndex(
    { name: 'text', description: 'text', category: 'text' },
    { name: 'products_text_search', weights: { name: 10, description: 5, category: 2 } }
  )

  // ── orders ────────────────────────────────────────────────────────────────
  const orders = db.collection('orders')
  await orders.createIndex({ orderNumber: 1 }, { unique: true, name: 'orders_number_unique' })
  await orders.createIndex({ guestEmail: 1 }, { name: 'orders_guest_email' })
  await orders.createIndex({ userId: 1, createdAt: -1 }, { name: 'orders_user_date' })
  await orders.createIndex(
    { status: 1, paymentStatus: 1 },
    { name: 'orders_status_payment' }
  )
  await orders.createIndex({ createdAt: -1 }, { name: 'orders_created_desc' })

  // ── reviews ───────────────────────────────────────────────────────────────
  const reviews = db.collection('reviews')
  await reviews.createIndex(
    { productId: 1, createdAt: -1 },
    { name: 'reviews_product_date' }
  )
  await reviews.createIndex({ orderId: 1 }, { name: 'reviews_order' })

  // ── reviewTokens ──────────────────────────────────────────────────────────
  const reviewTokens = db.collection('reviewTokens')
  await reviewTokens.createIndex({ token: 1 }, { unique: true, name: 'review_tokens_unique' })
  await reviewTokens.createIndex({ orderId: 1 }, { name: 'review_tokens_order' })
  // TTL index — MongoDB auto-deletes expired tokens
  await reviewTokens.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'review_tokens_ttl' }
  )

  // ── discountCodes ─────────────────────────────────────────────────────────
  const discountCodes = db.collection('discountCodes')
  await discountCodes.createIndex({ code: 1 }, { unique: true, name: 'discount_codes_unique' })
  await discountCodes.createIndex(
    { isActive: 1, expiresAt: 1 },
    { name: 'discount_codes_active_expiry' }
  )

  // ── subscribers ───────────────────────────────────────────────────────────
  const subscribers = db.collection('subscribers')
  await subscribers.createIndex({ email: 1 }, { unique: true, name: 'subscribers_email_unique' })

  // ── contacts ──────────────────────────────────────────────────────────────
  const contacts = db.collection('contacts')
  await contacts.createIndex({ createdAt: -1 }, { name: 'contacts_created_desc' })
  await contacts.createIndex({ status: 1 }, { name: 'contacts_status' })

  // ── addresses ─────────────────────────────────────────────────────────────
  const addresses = db.collection('addresses')
  await addresses.createIndex({ userId: 1 }, { name: 'addresses_user' })

  // ── wishlist ──────────────────────────────────────────────────────────────
  const wishlist = db.collection('wishlist')
  await wishlist.createIndex(
    { userId: 1, productId: 1 },
    { unique: true, name: 'wishlist_user_product_unique' }
  )

  // ── passwordResetTokens ───────────────────────────────────────────────────
  const passwordResetTokens = db.collection('passwordResetTokens')
  await passwordResetTokens.createIndex({ token: 1 }, { unique: true, name: 'reset_tokens_unique' })
  await passwordResetTokens.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'reset_tokens_ttl' }
  )

  console.log('[MongoDB] Indexes created successfully')
}
