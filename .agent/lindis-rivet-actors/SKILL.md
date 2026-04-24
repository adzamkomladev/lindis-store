---
name: lindis-rivet-actors
description: >-
  RivetKit actor system reference for Lindi's Store. Load when creating,
  modifying, or debugging actors, queues, workflows, or inter-actor communication.
---

# RivetKit Actor System — Lindi's Store

Context skill for working with the RivetKit actor framework in this project.

> **Announce:** "I'm loading lindis-rivet-actors context for actor development."

## Key Facts

- **Framework**: RivetKit v2 — actor framework for durable stateful services
- **9 actors** registered in `server/rivet/registry.ts`
- **Singleton actors** use key `['main']` — catalog, inventory, analytics, settings, workers
- **Per-entity actors** use dynamic keys — cart `[sessionId]`, order `[orderNumber]`
- **Import**: `import { actor, event, queue, UserError } from 'rivetkit'`
- **Workflow**: `import { workflow, Loop } from 'rivetkit/workflow'`
- **Client**: `useRivet()` returns typed client from `server/rivet/client.ts`

## Actor Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Nitro Server (API Routes)                    │
│                                                                   │
│   useRivet() ──────────────────────────────────────────────┐    │
│                                                             │    │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │    │
│   │catalogActor │  │inventoryActor│  │  analyticsActor   │ │    │
│   │  🏪 Key:[]  │  │  📦 Key:[]   │  │  📊 Key:[]       │ │    │
│   │     ['main']│  │    ['main']  │  │    ['main']      │ │    │
│   └──────┬───────┘  └──────┬───────┘  └──────────────────┘ │    │
│          │                 │                             │    │
│   ┌──────┴───────┐  ┌─────┴────────┐  ┌──────────────┐ │    │
│   │  cartActor   │  │  orderActor  │  │settingsActor │ │    │
│   │ 🛒 Key:[ses] │  │ 🔄 Key:[ord] │  │ ⚙️ Key:[]    │ │    │
│   └──────────────┘  └──────┬───────┘  └──────────────┘ │    │
│                            │                              │    │
│   ┌──────────────┐  ┌─────┴────────┐  ┌──────────────┐ │    │
│   │paymentWorker │  │  emailWorker  │  │reviewWorker  │ │    │
│   │ 💳 Key:[]    │  │  📧 Key:[]    │  │ ⭐ Key:[]     │ │    │
│   │   ['main']   │  │   ['main']    │  │  ['main']    │ │    │
│   └──────────────┘  └──────────────┘  └──────────────┘ │    │
│                                                         │    │
└─────────────────────────────────────────────────────────┘    │
                                                               │
┌──────────────────────────────────────────────────────────────▼──┐
│                    RivetKit Runtime                               │
│  (State persistence, event broadcasting, queue processing)       │
└──────────────────────────────────────────────────────────────────┘
```

## Actor Communication Map

```
API Routes ────▶ all actors (via useRivet() client)

cartActor ────▶ inventoryActor (stock validation: getStock, reserve)
orderActor ──▶ inventoryActor (reserve stock on checkout)
orderActor ──▶ emailWorker (order confirmation email)
paymentWorker ──▶ orderActor (push payment_confirmed command)
reviewWorker ──▶ emailWorker (review invitation email)
reviewWorker ──▶ catalogActor (update reviewStats on product)
orderActor ──▶ schedule (after 7 days: triggerReviewRequest)
```

## Actor Reference

### catalogActor (`['main']`) — In-memory product index

**Purpose**: Serves all product reads from memory (sub-ms). Persists writes to MongoDB.

**State**:
```ts
{
  products: ProductDoc[]
  bySlug: Record<string, ProductDoc>
  featured: ProductDoc[]
  byCategory: Record<string, ProductDoc[]>
  lastSynced: number
}
```

**Key Actions**:
- `getProducts(filters?)` — filter by status, category, featured
- `getProduct(slug)` — lookup by slug
- `getFeatured()` — featured products
- `getByCategory(category)` — category filter
- `createProduct(data)` — persist to MongoDB + update state
- `updateProduct(id, data)` — persist + rebuild indexes
- `deleteProduct(id)` — remove from MongoDB + state
- `updateReviewStats(productId, stats)` — called by reviewWorker
- `refresh()` — full rebuild from MongoDB (admin action)

**Pattern**: On `onCreate`, loads all products from MongoDB. All reads are in-memory. All writes persist to MongoDB first, then update in-memory state.

### inventoryActor (`['main']`) — Atomic stock management

**State**:
```ts
{
  stock: Record<string, number>  // productId → available count
}
```

**Key Actions**:
- `reserve(productId, qty)` — atomically decrement, throws `UserError` if insufficient
- `release(productId, qty)` — restore stock (cart abandoned, order cancelled)
- `getStock(productId)` — check stock for a product
- `setStock(productId, count)` — admin override
- `bulkSync(stockMap)` — bulk update from MongoDB

**Events**: `stockChanged`, `lowStock` (threshold: 5 units)

### orderActor (`[orderNumber]`) — Durable multi-step order workflow

**State**:
```ts
{
  order: OrderDoc | null
  phase: 'initiating' | 'inventory_reserved' | 'awaiting_payment' | 'paid' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
}
```

**Queue**: `commands: queue<OrderCommand>`

**Workflow** (uses `rivetkit/workflow`):
1. Wait for `initiate` command → create order in MongoDB + reserve inventory
2. Set phase to `awaiting_payment`
3. Wait for `payment_confirmed` command from paymentWorker
4. Confirm payment, update order in MongoDB
5. Send order confirmation email via emailWorker
6. Increment discount code usage
7. Schedule review request 7 days later

**Key Actions**:
- `getOrder()` — return current order
- `getPhase()` — return current phase
- `updateStatus(status)` — admin order status update
- `triggerReviewRequest()` — scheduled after 7 days

### paymentWorker (`['main']`) — Paystack verification queue

**Queues**:
- `payments: queue<PaymentPayload>` — verify + confirm
- `verifyPayments: queue<VerifyPaymentPayload>` — re-verify

**Pattern**: Iterates through queue messages. On successful verification, pushes `payment_confirmed` command to `orderActor`. On failure, updates order `paymentStatus` to `failed`.

### emailWorker (`['main']`) — Maileroo delivery queue

**Queue**: `emails: queue<EmailPayload>`

**Pattern**: Iterates through queue messages. Sends via `maileroo-sdk`. Tracks sent/failed counts. Failed emails logged but don't crash the worker.

**Payload**:
```ts
{
  to: string
  subject: string
  templateId: string
  data: Record<string, unknown>
}
```

### reviewWorker (`['main']`) — Review token + submission processor

**Queues**:
- `reviewRequests: queue<ReviewRequestPayload>` — create token + send email
- `reviewSubmissions: queue<ReviewSubmissionPayload>` — insert review + update stats

**Pattern**: On review submission:
1. Insert `ReviewDoc` into MongoDB
2. Recalculate `reviewStats` via aggregation
3. Update `catalogActor.updateReviewStats()`
4. Embed review in order item
5. Mark token as used

### analyticsActor (`['main']`) — Dashboard stats caching

**State**: `dashboardStats` object (aggregated from MongoDB)

**Pattern**: Loads stats on `onCreate`. Schedules hourly refresh via `c.schedule.after()`. Admin can trigger manual `refresh()`.

### settingsActor (`['main']`) — In-memory site configuration

**State**: `banner`, `storeName`, `storeEmail`, `storePhone`, `currency`, `lowStockThreshold`

**Pattern**: Loads from MongoDB on `onCreate`. `update()` persists changes then broadcasts `settingsUpdated` event.

## Creating a New Actor

### Step-by-step

1. **Create the actor file** at `server/rivet/actors/{name}-actor.ts`:
```ts
import { actor, event, queue, UserError } from 'rivetkit'

export const myActor = actor({
  options: { name: 'My Actor', icon: '🔖' },
  state: {
    // Define state shape
    items: [] as MyItem[],
  },
  events: {
    // Define broadcast events (optional)
    itemAdded: event<{ id: string }>(),
  },
  onCreate: async (c) => {
    // Load initial state from MongoDB (optional)
    // This runs once when the actor is first created
  },
  actions: {
    // Read actions (sync, return from state)
    getItems: (c) => c.state.items,

    // Write actions (async if they touch MongoDB)
    addItem: async (c, item: MyItem) => {
      // 1. Persist to MongoDB (if applicable)
      const { collections } = await import('~/server/db/collections')

      // 2. Update in-memory state
      c.state.items.push(item)

      // 3. Broadcast event (optional)
      c.broadcast('itemAdded', { id: item.id })

      return item
    },
  },
})
```

2. **Register in `server/rivet/registry.ts`**:
```ts
import { myActor } from './actors/my-actor'

export const registry = setup({
  endpoint: process.env.RIVET_ENDPOINT,
  use: {
    // ... existing actors
    myActor,
  },
})
```

3. **Use in API routes**:
```ts
const rivet = useRivet()
const result = await rivet.myActor.getOrCreate(['main']).addItem(data)
```

## Worker Pattern (Queue-Based Processing)

Workers process messages from queues asynchronously. They don't use workflows:

```ts
import { actor, queue } from 'rivetkit'

export interface MyPayload {
  type: string
  data: Record<string, unknown>
}

export const myWorker = actor({
  options: { name: 'My Worker', icon: '⚙️' },
  state: {
    processed: 0,
    failed: 0,
  },
  queues: {
    tasks: queue<MyPayload>(),
  },
  run: async (c) => {
    for await (const message of c.queue.iter()) {
      const { type, data } = message.body

      try {
        // Process the message
        if (type === 'do_something') {
          // ... handle
        }
        c.state.processed += 1
      } catch (error) {
        console.error('[MyWorker] Error:', error)
        c.state.failed += 1
        // Don't rethrow — failed messages shouldn't crash the worker
      }
    }
  },
  actions: {
    getStats: (c) => ({
      processed: c.state.processed,
      failed: c.state.failed,
    }),
  },
})
```

### Enqueueing from API routes:
```ts
// Use the queue helper (auto-imported)
import { enqueueEmail } from '~/server/utils/queues'

// Or enqueue directly
const rivet = useRivet()
await rivet.myWorker.getOrCreate(['main']).tasks.push({ type: 'do_something', data: { ... } })
```

## Workflow Pattern (Durable Multi-Step)

Used for the order lifecycle. Workflows use `ctx.step()` for durable execution and `ctx.queue.next()` for awaiting external events:

```ts
import { actor, queue, UserError } from 'rivetkit'
import { workflow, Loop } from 'rivetkit/workflow'

export const orderActor = actor({
  options: { name: 'Order Workflow', icon: '🔄' },
  state: {
    order: null as OrderDoc | null,
    phase: 'initiating' as OrderPhase,
  },
  queues: {
    commands: queue<OrderCommand>(),
  },
  run: workflow(async (ctx) => {
    // Step 1: Wait for initiate command
    const initCmd = await ctx.queue.next('wait-initiate') as { body: InitiateOrderCommand }

    await ctx.step('create-order', async () => {
      // Durable step — this will be replayed if actor restarts
      // Persist to MongoDB
      const { collections } = await import('~/server/db/collections')
      // ...
      ctx.state.order = orderDoc
    })

    // Step 2: Wait for external event (payment confirmation)
    const paymentCmd = await ctx.queue.next('wait-payment') as { body: PaymentConfirmedCommand }

    await ctx.step('confirm-payment', async () => {
      // Update MongoDB
      // ...
      ctx.state.phase = 'paid'
    })

    // ... more steps
  }),
  actions: {
    // Can still have regular actions alongside the workflow
    getOrder: (c) => c.state.order,
    getPhase: (c) => c.state.phase,
  },
})
```

## Inter-Actor Communication

### Actor-to-Actor Calls
```ts
// Inside an actor action or step:
const client = c.client<typeof import('../registry').registry>()

// Singleton actor
const stock = await client.inventoryActor.getOrCreate(['main']).getStock(productId)

// Per-entity actor
await client.orderActor.getOrCreate([orderNumber]).commands.push({
  type: 'payment_confirmed',
  reference: '...',
  amount: 50000,
})
```

### Broadcasting Events
```ts
// Define event in actor
events: {
  productUpdated: event<{ slug: string; product: ProductDoc | null }>(),
},

// Broadcast from an action
c.broadcast('productUpdated', { slug: product.slug, product })
```

### Scheduling Future Actions
```ts
// Schedule action 7 days in the future
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
ctx.schedule.after(SEVEN_DAYS_MS, 'triggerReviewRequest')

// The scheduled action must be defined in the actor
actions: {
  triggerReviewRequest: async (c) => {
    // ... send review email
  },
}
```

## UserError for Business Validation

```ts
import { UserError } from 'rivetkit'

// Throw UserError for expected business validation failures
throw new UserError('Insufficient stock', {
  code: 'out_of_stock',
  metadata: { productId, requested: qty, available: current },
})

// Common codes:
// 'slug_taken'       — product slug already exists
// 'out_of_stock'     — insufficient inventory
// 'invalid_discount' — discount code is invalid/expired
// 'discount_exhausted' — discount code usage limit reached
// 'not_found'        — entity not found
```

## Queue Helper Pattern

Queue helpers in `server/utils/queues.ts` provide a clean API surface:

```ts
// server/utils/queues.ts (auto-imported)
import { useRivet } from '~/server/rivet/client'

export async function enqueueEmail(payload: EmailPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.emailWorker.getOrCreate(['main']).emails.push(payload)
}

export async function enqueuePayment(payload: PaymentPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.paymentWorker.getOrCreate(['main']).payments.push(payload)
}
```

When adding a new queue, add a helper here following the same pattern.

## Actor State Persistence Pattern

**Rule**: Always persist to MongoDB BEFORE updating in-memory state.

```ts
// ✅ CORRECT — persist first, then update state
createProduct: async (c, data: CreateProductInput): Promise<ProductDoc> => {
  const { products: col } = collections()

  const product = { ...data, reviewStats: { averageRating: 0, totalCount: 0 }, createdAt: new Date() }
  const result = await col.insertOne(product as any)   // Persist first
  const inserted = { ...product, _id: result.insertedId }

  c.state.products.unshift(inserted)                   // Then update state
  c.state.bySlug[inserted.slug] = inserted
  c.broadcast('productUpdated', { slug: inserted.slug, product: inserted })
  return inserted
},

// ❌ WRONG — update state before persisting (data loss risk on crash)
createProduct: async (c, data) => {
  c.state.products.push(newProduct)        // State updated...
  await col.insertOne(newProduct)          // But what if this fails?
}
```

## Do NOT

- Forget to persist state changes to MongoDB (in-memory state is lost on restart)
- Use `import type` for the registry in actor client calls (prevents runtime registration)
- Forget to register new actors in `server/rivet/registry.ts`
- Use `c.state` directly in workflow steps (use `ctx.state` instead)
- Throw generic `Error` for business validation — use `UserError` instead
- Re-throw errors inside queue iterators (workers should continue processing)
- Use floating-point for pesewas values in actor state
- Forget the `['main']` key for singleton actors
- Access MongoDB collections directly inside synchronous actions (use `await import()`)
- Forget to update all indexes (bySlug, featured, byCategory) when a product changes

## Reference Files

- Registry: `server/rivet/registry.ts`
- Client: `server/rivet/client.ts`
- Catalog actor: `server/rivet/actors/catalog-actor.ts`
- Inventory actor: `server/rivet/actors/inventory-actor.ts`
- Cart actor: `server/rivet/actors/cart-actor.ts`
- Order actor: `server/rivet/actors/order-actor.ts`
- Payment worker: `server/rivet/actors/payment-worker.ts`
- Email worker: `server/rivet/actors/email-worker.ts`
- Review worker: `server/rivet/actors/review-worker.ts`
- Analytics actor: `server/rivet/actors/analytics-actor.ts`
- Settings actor: `server/rivet/actors/settings-actor.ts`
- Queue helpers: `server/utils/queues.ts`
- Database types: `server/db/types.ts`