---
name: lindis-ecommerce-domain
description: >-
  Business logic and e-commerce flow reference for Lindi's Store.
  Load when modifying checkout, payments, cart, inventory, discounts,
  reviews, order lifecycle, or any business rules.
---

# E-Commerce Domain Logic — Lindi's Store

Context skill for understanding business rules, state machines, and data flows.

> **Announce:** "I'm loading lindis-ecommerce-domain context for business logic."

## Key Facts

- **Currency**: Ghanaian Cedi (GHS). All prices stored as **pesewas** (1 GHS = 100 pesewas).
- **Guest checkout**: Orders don't require a user account. `guestEmail` + `shippingDetails` only.
- **Order prefix**: `ls-` + 8-char nanoid (lowercase). Example: `ls-x4kf2m9p`.
- **Reviews**: Token-based, not user-based. Review tokens expire after 30 days (TTL index).
- **Discounts**: 3 types — `percentage`, `fixed`, `free_shipping`. Codes stored UPPERCASE.

## Money Handling Rules

### Storage
All monetary values stored as **integer pesewas**:
```ts
// GHS 25.50 stored as 2550
price: 2550  // NOT 25.50 — never use floats for money
total: 50000 // NOT 500.00
discountAmount: 1275  // NOT 12.75
```

### Conversion
```ts
// GHS to pesewas (on input)
const pesewas = Math.round(ghsAmount * 100)

// Pesewas to GHS (for display)
const ghs = pesewas / 100

// Format for display
const formatted = new Intl.NumberFormat('en-GH', {
  style: 'currency',
  currency: 'GHS',
}).format(pesewas / 100)
// "GHS 25.50"
```

### Discount Calculations (in pesewas)
```ts
// Percentage discount
const discountAmount = Math.round(subtotal * (discount.value / 100))

// Fixed discount
const discountAmount = Math.min(discount.value, subtotal)  // can't exceed subtotal

// Free shipping — no change to total (shipping is not yet implemented)

// Final total (never negative)
const total = Math.max(0, subtotal - discountAmount)
```

**Critical**: Never use `parseFloat` or floating-point arithmetic for pesewa calculations. Always use `Math.round()` for any conversion.

## Order Lifecycle

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐
│ Initiate  │────▶│ Reserve Stock │────▶│ Await Payment   │
│ (POST)    │     │ (inventory)   │     │ (Paystack)      │
└──────────┘     └──────────────┘     └────────┬────────┘
                                                  │
                                          ┌───────▼────────┐
                                          │ Payment        │
                                          │ Confirmed      │
                                          └───────┬────────┘
                                                  │
                                    ┌─────────────▼─────────────┐
                                    │ Send Order Email          │
                                    │ Increment Discount Usage  │
                                    │ Schedule Review (7 days)  │
                                    └─────────────┬─────────────┘
                                                  │
                                          ┌───────▼────────┐
                                      ┌──▶│  Processing     │
                                      │   └───────┬────────┘
                                      │           │
                                      │   ┌───────▼────────┐
                                      │   │   Shipped       │
                                      │   └───────┬────────┘
                                      │           │
                                      │   ┌───────▼────────┐
                                      │   │   Delivered     │
                                      │   └───────────────┘
                                      │
                                      │   ┌───────────────┐
                                      └──▶│   Cancelled    │
                                          └───────────────┘
```

### Step-by-Step Flow

1. **Initiate** (`POST /api/orders/initiate`)
   - Validate body with `initiateOrderSchema`
   - Generate `orderNumber = ls-{nanoid(8).toLowerCase()}`
   - Generate `reference = pay-{orderNumber}` for Paystack
   - Calculate subtotal from items, validate discount code if provided
   - Initialize Paystack transaction via `usePaystack().initializeTransaction()`
   - Push `{ type: 'initiate', ... }` command to `orderActor.getOrCreate([orderNumber])`
   - Return `{ url, orderNumber, reference }` to client for redirect

2. **Reserve Stock** (inside orderActor workflow)
   - For each item, call `inventoryActor.getOrCreate(['main']).reserve(productId, quantity)`
   - Throws `UserError` if insufficient stock
   - State moves to `inventory_reserved`

3. **Await Payment** (orderActor workflow pauses)
   - State moves to `awaiting_payment`
   - Customer redirected to Paystack authorization URL
   - PaymentWorker verifies transaction via Paystack API
   - On success: pushes `{ type: 'payment_confirmed', ... }` to orderActor's commands queue

4. **Confirm Payment** (orderActor workflow resumes)
   - Update order in MongoDB: `paymentStatus: 'paid'`, `status: 'processing'`
   - State moves to `paid` then `confirmed`

5. **Send Order Confirmation Email**
   - Enqueue email to `emailWorker` via `orderActor` → `emailWorker`

6. **Increment Discount Usage**
   - If discount code was used, increment `usedCount` on discount code document

7. **Schedule Review Request**
   - `ctx.schedule.after(7 days, 'triggerReviewRequest')`
   - After 7 days, creates review tokens and sends review invitation email

### Order Status Values
```ts
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

type PaymentStatus = 'unpaid' | 'paid' | 'refunded'
```

## Payment Flow

### Paystack Integration

```
Customer ──▶ POST /api/orders/initiate
                    │
                    ▼
            Initialize Paystack Transaction
                    │
                    ▼
            Return authorization_url ──▶ Customer redirects to Paystack
                                                │
                                    ┌───────────┴───────────┐
                                    │                       │
                              Paystack callback         Paystack webhook
                                    │                       │
                                    ▼                       ▼
                          GET /api/orders/verify    POST /api/webhooks/paystack
                                    │                       │
                                    ▼                       ▼
                          Enqueue paymentWorker ─────────────┘
                                    │
                                    ▼
                          Verify with Paystack API
                                    │
                           ┌────────┴────────┐
                           │                 │
                      Success            Failure
                           │                 │
                           ▼                 ▼
                   Push to orderActor   Update payment
                   commands queue       status to 'failed'
```

### Paystack Transaction Init
```ts
const { initializeTransaction } = usePaystack()
const data = await initializeTransaction({
  email: body.email,
  amount: total,                  // pesewas
  reference: `pay-${orderNumber}`,
  callback_url: `${config.public.baseUrl}/api/orders/verify`,
  metadata: { orderNumber },
})
// data.authorization_url — redirect customer here
// data.reference — matches our reference
```

### Webhook Security
```ts
// server/api/webhooks/paystack.post.ts
import { createHmacSha512 } from '~/server/utils/hmac'

const signature = getHeader(event, 'x-paystack-signature')
const expected = await createHmacSha512(JSON.stringify(body), config.paystackSecretKey)
if (signature !== expected) {
  return sendError(event, createError({ statusCode: 401 }))
}
```

## Cart Architecture

### Client-Side Cart (`useCart.ts` composable)
The current implementation uses a **client-side cart** stored in `useState` + `localStorage`:
```ts
// app/composables/useCart.ts
export const useCart = () => {
  const cart = useState<CartState>('cart', () => ({ items: [] }))
  // Persists to localStorage on change
  // Calculates cartTotal and cartCount as computed values
  // Returns: { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }
}
```

### Server-Side Cart (RivetKit actor)
A `cartActor` exists for server-side cart operations with stock validation:
```ts
const rivet = useRivet()
const cart = rivet.cartActor.getOrCreate([sessionId])

// Add item with stock validation
await cart.addItem(product, quantity)  // throws UserError if insufficient stock

// Apply discount code
await cart.applyDiscount('SAVE10')    // throws UserError if invalid/expired

// Get cart summary
const summary = await cart.getCart()  // { items, discount, subtotal, total, itemCount }
```

### Checkout Flow (combines both)
1. Client builds cart via `useCart()` composable
2. On checkout, sends cart items + checkout data to `POST /api/orders/initiate`
3. Server validates discount code (if provided) against MongoDB
4. Server calculates final total in pesewas
5. Server reserves inventory via `inventoryActor`
6. Server initializes Paystack transaction
7. Customer redirected to Paystack
8. On success, client redirected to `/orders/success`

## Inventory System

### Stock Management (RivetKit inventoryActor)
```ts
const rivet = useRivet()
const inventory = rivet.inventoryActor.getOrCreate(['main'])

// Reserve stock (atomic, throws UserError if insufficient)
const remaining = await inventory.reserve(productId, quantity)

// Release stock (cart abandoned, order cancelled)
const newCount = await inventory.release(productId, quantity)

// Check stock
const stock = await inventory.getStock(productId)

// Admin: set stock directly
await inventory.setStock(productId, 50)

// Admin: bulk sync from MongoDB
await inventory.bulkSync({ 'product-id-1': 100, 'product-id-2': 25 })
```

### Low Stock Events
When stock drops to 5 or below, the inventoryActor broadcasts a `lowStock` event:
```ts
// Low stock threshold: 5 units
if (c.state.stock[productId] <= 5) {
  c.broadcast('lowStock', { productId, count: c.state.stock[productId], threshold: 5 })
}
```

## Discount Code System

### Validation Logic (server-side)
```ts
const discount = await discountCodes.findOne({
  code: code.toUpperCase(),    // Always stored UPPERCASE
  isActive: true,
  $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
})

// Check usage limit
if (discount.maxUses && discount.usedCount >= discount.maxUses) {
  throw new UserError('Discount code has reached its usage limit')
}

// Check minimum order amount (in pesewas)
if (discount.minOrderAmount && subtotal < discount.minOrderAmount) {
  // Invalid: below minimum
}

// Check minimum quantity
if (discount.minQuantity && cartQuantity < discount.minQuantity) {
  // Invalid: below minimum quantity
}

// Check product restriction (optional)
if (discount.productId && !itemsContainProduct(discount.productId)) {
  // Invalid: product not in cart
}

// Check category restriction (optional)
if (discount.categoryName && !itemsContainCategory(discount.categoryName)) {
  // Invalid: category not in cart
}
```

### Discount Types
```ts
type DiscountType = 'percentage' | 'fixed' | 'free_shipping'

// percentage — e.g., 10% off
discountAmount = Math.round(subtotal * (discount.value / 100))

// fixed — e.g., GHS 5.00 off (stored as 500 pesewas)
discountAmount = Math.min(discount.value, subtotal)

// free_shipping — no change to total (shipping not yet implemented)
discountAmount = 0 // preserved on order for future use
```

### Discount Snapshot on Order
When an order uses a discount, the code/type/value are **embedded** (snapshot) in the order document:
```ts
discount: {
  code: 'SAVE10',
  type: 'percentage',
  value: 10,           // percentage value, not calculated amount
}
// discountAmount is stored separately on the order
```

## Review System

### Token-Based Reviews (not user-based)
- After an order is delivered (7-day delay), a `reviewToken` document is created
- Each token contains: orderId, email, and a snapshot of purchased items
- Tokens expire after 30 days (MongoDB TTL index on `expiresAt`)
- Tokens are single-use (tracked via `usedAt` field)

### Review Submission Flow
1. Customer receives email with review link containing a token
2. `GET /api/reviews/validate?token=xxx` validates token existence and expiry
3. Customer fills out review form (rating 1-5, title, comment per product)
4. `POST /api/reviews/submit` processes each review via `reviewWorker`:
   - Inserts `ReviewDoc` into MongoDB
   - Recalculates `reviewStats` on the product via aggregation
   - Updates `catalogActor` in-memory stats
   - Embeds review into the corresponding order item
   - Marks token as `usedAt: new Date()`

### Computed reviewStats Pattern
Product `reviewStats` are **pre-calculated** on the product document:
```ts
reviewStats: {
  averageRating: 4.5,
  totalCount: 23,
}
```
These are updated atomically via aggregation when a review is submitted — NOT computed at query time.

## Order Item Snapshot Pattern

Order items include **snapshots** of product data at purchase time:
```ts
interface OrderItemDoc {
  productId: ObjectId           // reference to product
  productName: string            // SNAPSHOT (not live)
  productSlug: string            // SNAPSHOT
  productImages: string[]        // SNAPSHOT
  quantity: number
  priceAtPurchase: number        // SNAPSHOT in pesewas (not current price)
  customText?: string
  review?: {                     // EMBEDDED after review submission
    rating: number
    title?: string
    comment?: string
    createdAt: Date
  }
}
```
This prevents data inconsistency if the product price, name, or images change after purchase.

## Do NOT

- Store prices as floating-point numbers — always use integer pesewas
- Calculate discounts on the client side without server-side validation
- Skip stock reservation during checkout (leads to overselling)
- Compute review averages at display time (they're stored on the product)
- Forget to snapshot product data in order items (name, slug, images, price)
- Query review data without pagination (unbounded per product)
- Remove inventory reservation on order cancellation (must release stock)
- Forget to handle the case where Paystack verification fails gracefully
- Create user accounts for guest checkout (the system supports guestEmail)
- Assume all orders have a userId (they use guestEmail)

## Reference Files

- Order initiation: `server/api/orders/initiate.post.ts`
- Payment webhook: `server/api/webhooks/paystack.post.ts`
- Cart composable: `app/composables/useCart.ts`
- Cart actor: `server/rivet/actors/cart-actor.ts`
- Order actor: `server/rivet/actors/order-actor.ts`
- Inventory actor: `server/rivet/actors/inventory-actor.ts`
- Payment worker: `server/rivet/actors/payment-worker.ts`
- Review worker: `server/rivet/actors/review-worker.ts`
- Discount validation: `server/api/discount-codes/validate.post.ts`
- Review submission: `server/api/reviews/submit.post.ts`
- Database types: `server/db/types.ts`
- Order schema: `schemas/order.schema.ts`
- Cart types: `types/cart.ts`