---
name: lindis-debugger
description: >-
  Debugging guide for Lindi's Store. Load when troubleshooting bugs,
  tracing errors through the actor system, debugging API routes,
  or investigating frontend issues.
---

# Debugger — Lindi's Store

Debugging skill for tracing issues through this Nuxt 4 + MongoDB + RivetKit application.

> **Announce:** "I'm loading lindis-debugger context for troubleshooting."

## Key Facts

- **Logging**: Console logs in actors prefixed with `[ActorName]`
- **Actors**: RivetKit provides durable execution — workflows survive restarts
- **Queues**: Async processing — errors may appear in worker logs, not API responses
- **MongoDB**: Check indexes and query performance for slow operations
- **Frontend**: Vue DevTools + Nuxt DevTools for component state inspection

## Debugging the Actor System

### Actor Logs
Actors log to console with prefixed names:
```
[CatalogActor] Loaded 45 products into memory
[InventoryActor] Loaded stock for 45 products
[PaymentWorker] Failed to verify transaction: ...
```

Check server logs for actor console output.

### Actor State Inspection
Access actor state via actions:
```ts
// In an API route or another actor
const rivet = useRivet()

// Check order phase
const phase = await rivet.orderActor.getOrCreate(['ls-abc123']).getPhase()
console.log('Order phase:', phase) // 'initiating' | 'awaiting_payment' | 'paid' | ...

// Check inventory stock
const stock = await rivet.inventoryActor.getOrCreate(['main']).getStock(productId)
console.log('Stock:', stock)

// Check worker stats
const stats = await rivet.paymentWorker.getOrCreate(['main']).getStats()
console.log('Payments processed:', stats.processed, 'failed:', stats.failed)
```

### Workflow Tracing
Order workflows are durable multi-step processes. If a workflow seems stuck:

1. **Check the phase**:
```ts
const phase = await rivet.orderActor.getOrCreate([orderNumber]).getPhase()
// 'initiating' → waiting for initiate command
// 'awaiting_payment' → waiting for Paystack confirmation
// 'paid' → payment confirmed, processing next steps
```

2. **Check if paymentWorker processed the transaction**:
```ts
const stats = await rivet.paymentWorker.getOrCreate(['main']).getStats()
```

3. **Manually verify payment** (if webhook failed):
```ts
// Re-enqueue payment verification
await enqueueVerifyPayment({ reference, orderNumber })
```

4. **Check MongoDB directly**:
```ts
const order = await collections().orders.findOne({ orderNumber })
console.log('Payment status:', order.paymentStatus)
console.log('Order status:', order.status)
```

### Common Actor Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No runners available" error | RivetKit runner not running | Check RIVET_ENDPOINT env var, start runner |
| Order stuck at "awaiting_payment" | Webhook not received | Manually verify: `POST /api/orders/verify-payment` |
| Stock shows negative | Race condition in reservation | Check inventoryActor.reserve() logic |
| Product not appearing in catalog | catalogActor out of sync | Call `catalogActor.refresh()` |
| Email not sent | MAILEROO_API_KEY missing | Check env var, review emailWorker logs |
| Discount code not working | Case sensitivity | Codes stored UPPERCASE, validate with `.toUpperCase()` |

## Debugging API Routes

### Enable Request Logging
Add to any API route for debugging:
```ts
export default defineEventHandler(async (event) => {
  console.log(`[${event.method}] ${event.path}`)
  console.log('Headers:', Object.fromEntries(event.headers.entries()))
  console.log('Body:', await readBody(event))
  // ... handler logic
})
```

### Trace a Request Through the System
```
1. Client sends POST /api/orders/initiate
   → Log: body, validation result

2. Server generates orderNumber, reference
   → Log: orderNumber, reference

3. Paystack transaction initialized
   → Log: Paystack response, authorization_url

4. OrderActor workflow started
   → Log: [OrderActor] Received initiate command

5. Inventory reserved
   → Log: [InventoryActor] Reserved X units for product Y

6. Customer pays via Paystack
   → Log: (external, check Paystack dashboard)

7. Webhook received at /api/webhooks/paystack
   → Log: webhook body, signature verification result

8. PaymentWorker processes verification
   → Log: [PaymentWorker] Verification result

9. PaymentWorker pushes command to OrderActor
   → Log: [PaymentWorker] Pushed payment_confirmed to orderActor

10. OrderActor confirms payment
    → Log: [OrderActor] Payment confirmed, phase: paid

11. Email enqueued
    → Log: [EmailWorker] Processing email to customer@example.com
```

### Common API Errors

| Error | Meaning | Solution |
|-------|---------|----------|
| `403 Forbidden` | Admin middleware rejected | Check session, login at `/admin/login` |
| `400 Bad Request` | Zod validation failed | Check request body against schema |
| `404 Not Found` | Resource doesn't exist | Check ID/slug, verify in MongoDB |
| `500 Server Error` | Unhandled exception | Check server logs for stack trace |
| `slug_taken` | Product slug already exists | Use a different slug |
| `out_of_stock` | Insufficient inventory | Check inventoryActor stock |
| `invalid_discount` | Discount code invalid/expired | Verify code in discountCodes collection |

## Debugging MongoDB

### Check Connection
```ts
// In any API route
const db = getDB()
console.log('DB Name:', db.databaseName)
console.log('Collections:', await db.listCollections().toArray())
```

### Query Debugging
```ts
// Add explain() to slow queries
const result = await products
  .find({ category: 'blenders' })
  .explain('executionStats')
console.log('Query plan:', result)

// Check if index is used
// winningPlan.stage should be 'IXSCAN' not 'COLLSCAN'
```

### Common MongoDB Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Slow queries | Missing index | Add index in `server/db/indexes.ts`, run on startup |
| Duplicate key error | Unique constraint violation | Check existing document, use upsert carefully |
| TTL not working | TTL index not created | Ensure `createIndexes()` runs on startup |
| Connection timeout | Pool exhausted | Check `maxPoolSize` in `mongodb.ts` |

## Debugging Frontend

### Vue Component State
```vue
<script setup lang="ts">
// Add reactive logging
const { data: products, pending, error } = await useFetch('/api/products')

watch(error, (e) => {
  console.error('Fetch error:', e)
})

watch(products, (p) => {
  console.log('Products loaded:', p?.length)
})
</script>
```

### Cart Debugging
```ts
const { cart, cartTotal, cartCount } = useCart()

// Log cart state
console.log('Cart items:', cart.value.items)
console.log('Cart total:', cartTotal.value)
console.log('Cart count:', cartCount.value)

// Check localStorage
console.log('localStorage cart:', localStorage.getItem('lindis-store-cart'))
```

### Network Request Debugging
```ts
// In browser console
// Check all API calls
fetch('/api/products/featured')
  .then(r => r.json())
  .then(data => console.log('Featured:', data))
  .catch(e => console.error('Error:', e))
```

### Common Frontend Issues

| Symptom | Cause | Solution |
|---------|-------|----------|
| Blank page after navigation | Error in page setup | Check browser console, add error boundaries |
| Cart empty after refresh | localStorage parse error | Check console for JSON parse errors |
| Images not loading | R2 URL issue | Check `/api/images/` proxy, verify R2_PUBLIC_URL |
| Prices showing as 0 | Pesewas not converted | Ensure `/ 100` conversion in display |
| Form not submitting | Validation error | Check vee-validate errors object |
| Paystack not redirecting | CORS or URL issue | Check callback_url, browser network tab |

## Debugging Paystack Integration

### Test Payment Flow
1. Initiate order: `POST /api/orders/initiate`
2. Check response: should contain `authorization_url`
3. Visit URL in browser (use Paystack test mode)
4. Complete test payment
5. Check webhook delivery in Paystack dashboard
6. Verify order status in MongoDB

### Manual Payment Verification
```ts
// If webhook failed, manually verify
const { verifyTransaction } = usePaystack()
const data = await verifyTransaction('pay-ls-abc123')
console.log('Paystack status:', data.status)
console.log('Amount:', data.amount)
console.log('Reference:', data.reference)
```

### Paystack Dashboard Checks
- Webhook delivery logs
- Transaction status
- Failed transaction reasons
- Test vs live mode

## Debugging Email

### Check Email Worker Stats
```ts
const stats = await rivet.emailWorker.getOrCreate(['main']).getStats()
console.log('Sent:', stats.sent, 'Failed:', stats.failed)
console.log('Last error:', stats.lastError)
```

### Common Email Issues
| Symptom | Cause | Solution |
|---------|-------|----------|
| Emails not sending | MAILEROO_API_KEY missing | Check env var |
| Template not found | Wrong templateId | Verify template exists in Maileroo |
| Variables not rendering | Wrong template_variables keys | Match template variable names exactly |

## Performance Debugging

### Slow API Endpoints
```ts
// Add timing to handlers
export default defineEventHandler(async (event) => {
  const start = Date.now()

  const result = await someSlowOperation()

  console.log(`[TIMING] ${event.path} took ${Date.now() - start}ms`)
  return result
})
```

### Actor Performance
```ts
// catalogActor reads are in-memory (sub-ms)
// If slow, check if actor is running or falling back to MongoDB
const start = Date.now()
const products = await rivet.catalogActor.getOrCreate(['main']).getProducts()
console.log(`Catalog read took ${Date.now() - start}ms`)
```

### Bundle Size
```bash
# Analyze bundle size
npx nuxt analyze
```

## Do NOT

- Add `debugger` statements and commit them
- Log sensitive data (passwords, API keys, session tokens)
- Leave temporary debug endpoints in production
- Ignore actor errors — they often indicate logic bugs
- Skip checking queue worker logs when async operations fail
- Forget to remove debug console.logs before committing
- Use `console.log` in production — use structured logging instead

## Reference Files

- Actor system: `server/rivet/actors/*.ts`
- Queue helpers: `server/utils/queues.ts`
- MongoDB connection: `server/db/mongodb.ts`
- Paystack utility: `server/utils/paystack.ts`
- Cart composable: `app/composables/useCart.ts`
- Nuxt config: `nuxt.config.ts`
- Nitro presets: https://nitro.unjs.io/guide/presets