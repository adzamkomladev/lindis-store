---
name: lindis-store-context
description: >-
  Architecture deep-dive for Lindi's Store. Load when starting work on any part
  of this codebase to understand project structure, database schema, actor system,
  and critical conventions.
---

# Lindi's Store — Architecture Deep-Dive

Context skill for understanding the full architecture of this Nuxt 4 e-commerce application.

> **Announce:** "I'm loading lindis-store-context for project architecture."

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Nuxt 4 Frontend                      │
│             app/ (pages, components, composables)         │
│             TailwindCSS 4 + shadcn-vue + reka-ui         │
└──────────────────────┬──────────────────────────────────┘
                       │ $fetch / useFetch
┌──────────────────────▼──────────────────────────────────┐
│                  Nitro Server                             │
│             server/api/ (REST endpoints)                   │
│             server/middleware/ (admin auth guard)          │
│             server/utils/ (auto-imported utilities)        │
└────┬────────────┬──────────────┬────────────────────────┘
     │            │              │
     ▼            ▼              ▼
┌─────────┐  ┌────────┐  ┌──────────────┐
│ MongoDB  │  │RivetKit│  │ Paystack     │
│ (6 cols) │  │ Actors │  │ Maileroo     │
│          │  │ (9)    │  │ Cloudflare R2│
└─────────┘  └────┬───┘  └──────────────┘
                  │
     ┌────────────┼────────────────┐
     ▼            ▼                ▼
 catalogActor  orderActor    paymentWorker
 inventoryActor cartActor    emailWorker
                analyticsActor  reviewWorker
                settingsActor
```

## Database Schema (6 Collections)

### `users` — Merged with credentials (1:1 Embed)
```ts
interface UserDoc {
  _id?: ObjectId
  email: string                    // unique index
  name?: string
  role: 'admin' | 'customer'
  credentials: {                   // EMBEDDED (was separate accounts table)
    provider: string               // 'local' | 'google'
    passwordHash?: string
    providerAccountId?: string
  }[]
  createdAt: Date
  updatedAt: Date
}
```

### `products` — Computed + Polymorphic patterns
```ts
interface ProductDoc {
  _id?: ObjectId
  name: string
  slug: string                      // unique index
  description?: string
  price: number                      // PESEWAS (integer)
  currency: string                  // 'GHS'
  inventoryCount: number
  images: string[]                   // R2 public URLs
  status: 'draft' | 'active' | 'archived'
  isFeatured: boolean
  category: string                   // kitchen category slug
  type: 'standard' | 'auction'       // POLYMORPHIC
  specs: ProductSpecs               // flat optional fields
  reviewStats: {                    // COMPUTED — updated on review submission
    averageRating: number
    totalCount: number
  }
  auctionDetails?: { ... }          // only when type === 'auction'
  createdAt: Date
  updatedAt: Date
}
```

### `orders` — Embedded items + payment + discount
```ts
interface OrderDoc {
  _id?: ObjectId
  orderNumber: string                // unique index, prefix "ls-"
  guestEmail: string                // guest checkout
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
  subtotal: number                  // pesewas
  discountAmount: number             // pesewas
  total: number                      // pesewas
  discount: { code, type, value } | null  // EMBEDDED snapshot
  items: OrderItemDoc[]              // EMBEDDED 1:Few (bounded 1-50)
  // Each item snapshots: productName, productSlug, productImages, priceAtPurchase
  payment: { reference, provider, amount, status }  // EMBEDDED 1:1
  shippingDetails: { name, phone, address, city }
  createdAt: Date
}
```

### `reviews` — Separate collection (1:Many, paginated)
```ts
interface ReviewDoc {
  _id?: ObjectId
  productId: ObjectId               // index
  orderId: ObjectId
  orderNumber: string                // DENORMALIZED for display
  customerEmail: string
  customerName: string
  rating: number                     // 1-5
  title?: string
  comment?: string
  createdAt: Date
}
```

### `reviewTokens` — Single-use review invitation tokens
```ts
interface ReviewTokenDoc {
  _id?: ObjectId
  orderId: ObjectId
  orderNumber: string                // DENORMALIZED
  token: string                      // unique index
  email: string
  items: { productId, productName, productImages }[]  // DENORMALIZED snapshot
  expiresAt: Date                    // TTL index — auto-deleted after 30 days
  usedAt?: Date
  createdAt: Date
}
```

### `discountCodes` — Admin-managed promotional codes
```ts
interface DiscountCodeDoc {
  _id?: ObjectId
  code: string                       // unique index, stored UPPERCASE
  description?: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount?: number           // pesewas
  minQuantity?: number
  maxUses?: number
  usedCount: number
  productId?: ObjectId               // restrict to product
  categoryName?: string              // restrict to category
  startsAt?: Date
  expiresAt?: Date
  isActive: boolean
  createdAt: Date
}
```

## Indexes

| Collection | Index | Type |
|-----------|-------|------|
| users | `email` | unique |
| products | `slug` | unique |
| products | `{status, isFeatured, createdAt}` | compound |
| products | `{category, status}` | compound |
| products | `{type, status}` | compound |
| orders | `orderNumber` | unique |
| orders | `{status, paymentStatus}` | compound |
| orders | `createdAt` | descending |
| reviews | `{productId, createdAt}` | compound |
| reviews | `orderId` | single |
| reviewTokens | `token` | unique |
| reviewTokens | `expiresAt` | TTL (auto-delete) |
| discountCodes | `code` | unique |
| discountCodes | `{isActive, expiresAt}` | compound |

## RivetKit Actor System (9 Actors)

| Actor | Key | Purpose | State |
|-------|-----|---------|-------|
| catalogActor | `['main']` | In-memory product catalog index | products[], bySlug, featured[], byCategory |
| inventoryActor | `['main']` | Atomic stock reservation | stock: Record<productId, count> |
| cartActor | `[sessionId]` | Per-session server-side cart | items[], discountCode |
| orderActor | `[orderNumber]` | Durable multi-step order workflow | order, phase |
| paymentWorker | `['main']` | Paystack verification queue | processed, failed |
| emailWorker | `['main']` | Maileroo delivery queue | sent, failed |
| reviewWorker | `['main']` | Review token + submission processor | (queue-driven) |
| analyticsActor | `['main']` | Dashboard stats caching | dashboardStats |
| settingsActor | `['main']` | In-memory site configuration | banner, storeName, etc. |

### Actor Communication Map
```
catalogActor ←─── reviewWorker (update reviewStats)
inventoryActor ←─── cartActor (stock validation)
inventoryActor ←─── orderActor (reserve/release stock)
orderActor ←─── paymentWorker (payment confirmation push)
orderActor →─── emailWorker (order confirmation)
orderActor →─── inventoryActor (reserve stock)
reviewWorker →─── emailWorker (review invitation)
reviewWorker →─── catalogActor (update review stats)
```

## File Structure

```
app/
├── pages/
│   ├── index.vue                    # Storefront home
│   ├── products/index.vue           # Product listing
│   ├── products/[slug].vue          # Product detail
│   ├── cart.vue                     # Shopping cart
│   ├── checkout.vue                 # Checkout flow
│   ├── orders/[id].vue              # Order status
│   ├── orders/success.vue           # Order confirmation
│   ├── review/[token].vue           # Review submission
│   └── admin/
│       ├── index.vue                # Dashboard
│       ├── login.vue                # Admin login
│       ├── products/                # Product CRUD
│       ├── orders/                  # Order management
│       ├── users/                   # User management
│       ├── discount-codes/          # Coupon management
│       ├── payments/                # Payment tracking
│       └── settings.vue             # Store settings
├── components/
│   ├── ui/                          # shadcn-vue components
│   ├── admin/                       # Admin-specific components
│   ├── products/                    # Product display components
│   ├── cart/                        # Cart components
│   ├── checkout/                    # Checkout components
│   └── home/                        # Homepage sections
├── composables/
│   ├── useCart.ts                   # Client-side cart (localStorage)
│   ├── useAlertDialog.ts            # Global alert dialog
│   └── auth.ts                      # Admin auth (useAuth)
└── layouts/
    ├── default.vue                  # Storefront layout
    └── admin.vue                    # Admin layout (sidebar + header)

server/
├── api/
│   ├── products/                    # Public product endpoints
│   ├── orders/                      # Order endpoints
│   ├── reviews/                     # Review endpoints
│   ├── images/                      # Image proxy
│   ├── discount-codes/              # Discount validation
│   ├── stats.get.ts                # Public stats
│   ├── settings/                    # Banner/settings
│   ├── auth/                        # Login/logout
│   ├── webhooks/
│   │   └── paystack.post.ts        # Paystack webhook
│   └── admin/                       # Admin-only endpoints
│       ├── products/                # Product CRUD
│       ├── orders/                  # Order management
│       ├── users/                   # User management
│       ├── discount-codes/          # Coupon CRUD
│       ├── payments/                # Payment list
│       ├── stats.get.ts            # Dashboard stats
│       ├── revenue.get.ts          # Revenue chart data
│       └── settings/               # Settings CRUD
├── rivet/
│   ├── registry.ts                 # Actor registration
│   ├── client.ts                   # useRivet() helper
│   └── actors/
│       ├── catalog-actor.ts        # Product catalog
│       ├── inventory-actor.ts      # Stock management
│       ├── cart-actor.ts           # Shopping cart
│       ├── order-actor.ts          # Order workflow
│       ├── payment-worker.ts       # Payment processing
│       ├── email-worker.ts         # Email delivery
│       ├── review-worker.ts        # Review processing
│       ├── analytics-actor.ts      # Dashboard stats
│       └── settings-actor.ts       # Site configuration
├── db/
│   ├── mongodb.ts                  # Connection singleton
│   ├── collections.ts             # Type-safe collection accessors
│   ├── types.ts                    # Document interfaces
│   └── indexes.ts                  # MongoDB index definitions
├── utils/                          # Auto-imported utilities
│   ├── db.ts                       # Re-exports from db/
│   ├── paystack.ts                 # Paystack API wrapper
│   ├── email.ts                    # Maileroo templated email
│   ├── queues.ts                   # Rivet queue helpers
│   ├── hmac.ts                     # HMAC-SHA512 (webhook verification)
│   └── r2.ts                       # Cloudflare R2 upload/delete
├── middleware/
│   └── admin.ts                    # Admin auth guard
├── plugins/
│   ├── mongodb.ts                  # MongoDB connection on startup
│   └── seed-admin.ts              # Auto-seed admin user
└── routes/
    └── images/[...pathname].get.ts  # R2 image proxy

schemas/
├── product.schema.ts               # Product create/update
├── order.schema.ts                 # Order initiation, validation
├── review.schema.ts                # Review submission
├── discount-code.schema.ts          # Discount code CRUD
├── user.schema.ts                  # User management
├── auth.schema.ts                  # Login/register
├── settings.schema.ts              # Settings update
└── stats.schema.ts                 # Revenue query

types/
├── cart.ts                         # CartItem, CartState
├── email.ts                        # EmailTemplate enum
├── paystack.ts                     # Paystack types
└── auth.d.ts                       # Session user type
```

## Common Pitfalls

1. **Pesewas math**: All prices stored as integers (pesewas). Never use floating-point for money. Convert for display: `(price / 100).toLocaleString('en-GH', { style: 'currency', currency: 'GHS' })`.

2. **ObjectId strings**: MongoDB ObjectIDs are serialized as 24-char hex strings in API responses and validated by `z.string().regex(/^[a-f\d]{24}$/i)`. Convert with `new ObjectId(string)` on the server.

3. **Import paths**: In Nuxt 4, `~/` resolves to `app/`, not project root. Server files that need schemas or types use `~~/schemas` and `~~/types`.

4. **Auto-imports**: Everything in `server/utils/*` is auto-imported by Nitro. Never write `import { usePaystack } from '~/server/utils/paystack'`.

5. **Actor keys**: Singleton actors (catalog, inventory, analytics, settings, workers) use `getOrCreate(['main'])`. Per-entity actors (cart, order) use `getOrCreate([orderId])` or `getOrCreate([sessionId])`.

6. **Guest checkout**: Orders don't require a user account. They use `guestEmail` + `shippingDetails`. Don't assume `user` exists on order routes.

7. **Review auth**: Reviews use token-based auth (`reviewToken`), not user sessions. Don't add `requireUserSession` to review routes.

8. **Admin middleware**: The auth guard is in `server/middleware/admin.ts` and runs on all `/api/admin/**` routes. It checks `session.user.role === 'admin'`.

9. **Workflow pattern**: The orderActor uses RivetKit's `workflow` construct with `ctx.step()` for durable multi-step execution and `ctx.queue.next()` for awaiting external events (payment confirmation).

10. **Computed pattern**: Product `reviewStats` are pre-calculated and stored on the product document, updated atomically when reviews are submitted. Don't query reviews to compute averages at display time.

## Related Skills

- `.agent/lindis-api-endpoints` — Server API patterns and conventions
- `.agent/lindis-ecommerce-domain` — Business logic and flows
- `.agent/lindis-rivet-actors` — Actor system reference
- `.agent/lindis-admin-panel` — Admin UI patterns
- `.agent/lindis-frontend` — Storefront patterns
- `.agent/shadcn-vue` — UI component library
- `.agent/vee-validate-zod` — Form validation
- `.agent/ui-design-basics` — Design principles

## Reference Files

- Database types: `server/db/types.ts`
- Collections: `server/db/collections.ts`
- Indexes: `server/db/indexes.ts`
- Actor registry: `server/rivet/registry.ts`
- Actor client: `server/rivet/client.ts`
- Schemas: `schemas/*.ts`
- Nuxt config: `nuxt.config.ts`