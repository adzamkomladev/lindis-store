---
name: lindis-api-endpoints
description: >-
  Context and patterns for building Nitro server API endpoints in Lindi's Store.
  Load when creating, modifying, or debugging API routes in server/api/.
---

# Server API Endpoints — Lindi's Store

Context skill for building and modifying API routes in this Nuxt 4 + MongoDB + RivetKit project.

> **Announce:** "I'm loading lindis-api-endpoints context for API development."

## Key Facts

- **Framework**: Nuxt 4 with Nitro server (Node.js preset, `node-server`)
- **Database**: MongoDB via `collections()` helper from `server/db/collections.ts`
- **Actors**: RivetKit actors via `useRivet()` from `server/rivet/client.ts`
- **Auth**: `nuxt-auth-utils` — `requireUserSession(event)` for admin, public for storefront
- **Validation**: Zod schemas from `schemas/` directory
- **Auto-imports**: `server/utils/*` are auto-imported — DO NOT manually import them
- **WebSocket**: Nitro experimental WebSocket enabled for RivetKit actor events

## API Endpoint Pattern

```ts
// server/api/orders/initiate.post.ts
import { initiateOrderSchema } from '~~/schemas/order.schema'
import { nanoid } from 'nanoid'
import { useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  // 1. Validate request body
  const body = await readValidatedBody(event, initiateOrderSchema.parse)

  // 2. Business logic — use actors or direct MongoDB
  const rivet = useRivet()
  const orderNumber = `ls-${nanoid(8).toLowerCase()}`
  const orderActor = rivet.orderActor.getOrCreate([orderNumber])

  // 3. Push command to actor workflow
  await orderActor.commands.push({ type: 'initiate', ... })

  // 4. Return response
  return { orderNumber, reference }
})
```

## Authentication Patterns

### Admin-Only Routes
Admin routes are protected by `server/middleware/admin.ts` which checks all `/api/admin/**` paths:
```ts
// server/middleware/admin.ts automatically runs before admin handlers
// It checks: getUserSession(event).user.role === 'admin'
// No need to manually check in individual handlers

// server/api/admin/products.post.ts
export default defineEventHandler(async (event) => {
  // Admin auth already verified by middleware
  const session = await getUserSession(event)
  // session.user.email, session.user.role available
})
```

### Public Routes (Storefront)
Storefront routes have no auth requirement:
```ts
// server/api/products/index.get.ts — public product listing
export default defineEventHandler(async (event) => {
  const rivet = useRivet()
  const products = await rivet.catalogActor.getOrCreate(['main']).getProducts()
  return products
})
```

### Token-Based Routes (Reviews)
Some routes use token-based auth, not user sessions:
```ts
// server/api/reviews/submit.post.ts — validates reviewToken, not user session
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, reviewSubmitSchema.parse)
  const { reviewTokens } = collections()
  const token = await reviewTokens.findOne({ token: body.token })
  if (!token || token.usedAt || token.expiresAt < new Date()) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Invalid or expired token' }))
  }
  // ... process review
})
```

## Validation Patterns

### Server-Side Validation
```ts
import { productSchema } from '~~/schemas/product.schema'
import { initiateOrderSchema } from '~~/schemas/order.schema'

// Body validation
const body = await readValidatedBody(event, productSchema.parse)

// Query validation
const query = await getValidatedQuery(event, querySchema.parse)

// Route params
const id = getRouterParam(event, 'id')

// ObjectId validation (in schemas)
const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID')
```

### Schema Location Convention
Schemas live in the root `schemas/` directory, NOT inline in components or API handlers:
```ts
// schemas/product.schema.ts — always define here
// schemas/order.schema.ts
// schemas/review.schema.ts
// etc.

// Import in handlers
import { productSchema } from '~~/schemas/product.schema'
```

## Error Handling

```ts
// Client-friendly errors
return sendError(
  event,
  createError({
    statusCode: 400,
    statusMessage: 'Product slug is already in use',
  }),
)

// Common status codes:
// 400 — Bad Request (validation, duplicate, invalid)
// 401 — Unauthorized
// 403 — Forbidden (no admin permission)
// 404 — Not Found
// 500 — Server Error

// RivetKit business validation errors
import { UserError } from 'rivetkit'
throw new UserError('Insufficient stock', {
  code: 'out_of_stock',
  metadata: { productId, requested: qty, available: current },
})
```

## Actor Interaction Patterns

### Singleton Actors (catalog, inventory, analytics, settings, workers)
```ts
const rivet = useRivet()

// Read from in-memory catalog
const products = await rivet.catalogActor.getOrCreate(['main']).getProducts()

// Check stock
const stock = await rivet.inventoryActor.getOrCreate(['main']).getStock(productId)

// Get dashboard stats
const stats = await rivet.analyticsActor.getOrCreate(['main']).getDashboardStats()
```

### Per-Entity Actors (order, cart)
```ts
const rivet = useRivet()

// Order actor — keyed by orderNumber
const order = await rivet.orderActor.getOrCreate([orderNumber]).getOrder()

// Cart actor — keyed by session ID (conceptual, current implementation uses client-side cart)
const cart = await rivet.cartActor.getOrCreate([sessionId]).getCart()
```

### Queue-Based Interactions
```ts
import { enqueueEmail, enqueuePayment, enqueueReviewRequest } from '~/server/utils/queues'

// These are auto-imported — DO NOT import them manually

// Enqueue email
await enqueueEmail({
  to: 'customer@example.com',
  subject: 'Order Confirmed',
  templateId: 'order_confirmation',
  data: { orderNumber: 'ls-abc12345' },
})

// Enqueue payment verification
await enqueuePayment({
  reference: 'pay-ls-abc12345',
  orderNumber: 'ls-abc12345',
  amount: 50000, // pesewas
})

// Enqueue review request
await enqueueReviewRequest({
  orderId: '...',
  orderNumber: 'ls-abc12345',
  email: 'customer@example.com',
  customerName: 'John Doe',
  items: [...],
})
```

## Direct MongoDB Fallback

For read-only queries that don't need actor state, use MongoDB directly:
```ts
import { collections } from '~/server/db/collections'

export default defineEventHandler(async (event) => {
  const { products } = collections()

  // Simple read — no actor needed
  const product = await products.findOne({ slug: params.slug, status: 'active' })

  // Aggregation
  const stats = await orders.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
  ]).toArray()

  return product
})
```

**Important**: Use actors for any operation that involves:
- Product catalog reads (in-memory, sub-ms)
- Stock checks or reservations (atomic consistency)
- Order workflow steps (durable via RivetKit)
- Settings reads (in-memory)

Use MongoDB directly for:
- Admin dashboard aggregations (analytics actor caches these)
- One-off queries that don't need actor state
- Search/filter queries with complex criteria

## Response Format Convention

```ts
// Success responses — return plain objects
return { products, total, page }

// Created resources — return the created document
return product // the full ProductDoc

// Empty success
return { success: true }

// Paginated responses
return {
  data: products,
  total: count,
  page: pageNum,
  pageSize: pageSizeNum,
}
```

## File Organization

```
server/api/
├── admin/                    # Admin-only (auth middleware runs automatically)
│   ├── products/             # Product CRUD
│   │   ├── index.get.ts      # List products (all statuses)
│   │   ├── index.post.ts     # Create product
│   │   └── [id]/
│   │       ├── index.get.ts  # Get single product
│   │       ├── index.put.ts  # Update product
│   │       └── index.delete.ts # Delete product
│   ├── orders/               # Order management
│   │   ├── index.get.ts      # List orders
│   │   ├── recent.get.ts     # Recent orders
│   │   └── [id]/
│   │       ├── index.get.ts  # Get order
│   │       └── [id].put.ts   # Update order
│   ├── users/                # User management
│   ├── discount-codes/       # Coupon CRUD
│   ├── payments/             # Payment tracking
│   ├── settings/             # Settings read/update
│   ├── stats.get.ts          # Dashboard stats
│   └── revenue.get.ts        # Revenue chart data
├── products/                 # Public product endpoints
│   ├── index.get.ts          # List active products
│   ├── featured.get.ts       # Featured products
│   └── [slug].get.ts         # Product by slug
├── orders/                   # Order endpoints
│   ├── initiate.post.ts      # Create order + Paystack init
│   ├── verify.get.ts         # Verify payment (redirect)
│   └── verify-payment.post.ts # Verify payment (API)
├── reviews/                  # Review endpoints
│   ├── submit.post.ts        # Submit review
│   ├── validate.get.ts       # Validate review token
│   └── [productId].get.ts   # Get product reviews
├── discount-codes/           # Discount validation
│   └── validate.post.ts      # Validate discount code
├── images/                   # Image proxy
│   └── upload.post.ts        # Upload image to R2
├── stats.get.ts              # Public stats
├── settings/
│   └── banner.get.ts         # Get banner text
├── auth/                     # Authentication
│   ├── login.post.ts         # Admin login
│   └── logout.post.ts        # Admin logout
├── setup-admin.post.ts      # One-time admin setup
└── webhooks/
    └── paystack.post.ts     # Paystack webhook
```

## Paystack Integration

```ts
// Initialize transaction (used in initiate.post.ts)
const { initializeTransaction } = usePaystack()
const result = await initializeTransaction({
  email: 'customer@example.com',
  amount: 50000, // pesewas
  reference: 'pay-ls-abc12345',
  callback_url: `${config.public.baseUrl}/api/orders/verify`,
  metadata: { orderNumber: 'ls-abc12345' },
})
// result.authorization_url — redirect customer here

// Verify transaction (used in payment-worker.ts)
const { verifyTransaction } = usePaystack()
const data = await verifyTransaction(reference)
```

## Webhook Pattern

```ts
// server/api/webhooks/paystack.post.ts
import { createHmacSha512 } from '~/server/utils/hmac'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const signature = getHeader(event, 'x-paystack-signature')

  // Verify HMAC signature
  const config = useRuntimeConfig()
  const expectedSig = await createHmacSha512(JSON.stringify(body), config.paystackSecretKey)
  if (signature !== expectedSig) {
    return sendError(event, createError({ statusCode: 401, statusMessage: 'Invalid signature' }))
  }

  // Process webhook event
  if (body.event === 'charge.success') {
    await enqueuePayment({ reference: body.data.reference, ... })
  }

  return { received: true }
})
```

## R2 Image Upload

```ts
import { useR2 } from '~/server/utils/r2'

// Upload
const { upload, getPublicUrl } = useR2()
await upload(key, buffer, contentType)
const url = getPublicUrl(key)

// Upload route example (server/api/images/upload.post.ts)
export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  const file = formData?.find(f => f.name === 'file')
  if (!file) return sendError(event, createError({ statusCode: 400, statusMessage: 'No file' }))

  const key = `products/${Date.now()}-${file.filename}`
  const { upload, getPublicUrl } = useR2()
  await upload(key, file.data, file.type!)
  return { url: getPublicUrl(key) }
})
```

## Do NOT

- Import from `server/utils/*` manually — they are auto-imported by Nitro
- Use `requireUserSession()` on public storefront routes
- Forget to validate request bodies with Zod schemas
- Store monetary values as floats — always use pesewas (integers)
- Skip admin auth on admin routes (the middleware handles it, but don't bypass it)
- Create new database collections without adding types to `server/db/types.ts` and indexes to `server/db/indexes.ts`
- Use `~/server/` in server imports — use `~/server/` or the alias from `nuxt.config.ts`
- Forget to handle the case where RivetKit runner is unavailable (`isRivetRunnerUnavailable()`)

## Reference Files

- Example POST: `server/api/orders/initiate.post.ts`
- Example admin GET: `server/api/admin/stats.get.ts`
- Example admin CRUD: `server/api/admin/products.post.ts`
- Actor client: `server/rivet/client.ts`
- Queue helpers: `server/utils/queues.ts`
- Paystack: `server/utils/paystack.ts`
- Email: `server/utils/email.ts`
- HMAC: `server/utils/hmac.ts`
- R2: `server/utils/r2.ts`
- Middleware: `server/middleware/admin.ts`
- Collections: `server/db/collections.ts`
- Schemas: `schemas/*.schema.ts`