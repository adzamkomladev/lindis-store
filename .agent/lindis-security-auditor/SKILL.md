---
name: lindis-security-auditor
description: >-
  Security review patterns for Lindi's Store. Load when reviewing code for
  security vulnerabilities, implementing auth, handling payments, processing
  user input, or reviewing API endpoints for security issues.
---

# Security Auditor — Lindi's Store

Security review skill for identifying vulnerabilities in this Nuxt 4 + MongoDB + RivetKit e-commerce application.

> **Announce:** "I'm loading lindis-security-auditor context for security review."

## Key Facts

- **Stack**: Nuxt 4, Nitro, MongoDB, RivetKit, Paystack, Maileroo, R2
- **Auth**: Session-based via `nuxt-auth-utils`, admin-only
- **Payments**: Paystack webhooks with HMAC-SHA512 verification
- **File uploads**: Cloudflare R2 via AWS SDK
- **Database**: MongoDB with NoSQL injection risks
- **Reviews**: Token-based auth (not session-based)

## Security Checklist for New Code

### Authentication & Authorization

- [ ] Admin routes use `requireUserSession()` or the admin middleware
- [ ] Admin middleware (`server/middleware/admin.ts`) checks `user.role === 'admin'`
- [ ] Public routes don't accidentally expose admin data
- [ ] Guest checkout endpoints don't leak other customers' orders
- [ ] Review tokens are single-use and expire (30-day TTL)

```ts
// ✅ CORRECT — Admin middleware protects all /api/admin/* routes
// server/middleware/admin.ts
export default defineEventHandler(async (event) => {
  if (pathname.startsWith('/api/admin')) {
    const session = await getUserSession(event)
    if (!session.user || session.user.role !== 'admin') {
      throw createError({ statusCode: 403 })
    }
  }
})

// ❌ WRONG — Manual check that can be forgotten
export default defineEventHandler(async (event) => {
  // Forgot to check admin role!
  const body = await readBody(event)
  await deleteAllProducts(body.id)
})
```

### MongoDB / NoSQL Injection

- [ ] All user input validated with Zod before MongoDB queries
- [ ] No raw user input in `$where`, `$expr`, or `$function` operators
- [ ] ObjectId strings validated with regex before conversion

```ts
// ✅ CORRECT — Zod validates before query
const params = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) })
const { id } = params.parse(body)
await products.findOne({ _id: new ObjectId(id) })

// ❌ WRONG — Raw user input in query
const { id } = await readBody(event)
await products.findOne({ _id: new ObjectId(id) })  // id could be anything

// ❌ WRONG — No validation on query parameters
const { category } = getQuery(event)
await products.find({ category })  // NoSQL injection possible
```

### Paystack Webhook Security

- [ ] HMAC-SHA512 signature verified on every webhook request
- [ ] Webhook endpoint returns 200 only after successful processing
- [ ] Duplicate webhook events handled idempotently

```ts
// ✅ CORRECT — Verify HMAC signature
import { createHmacSha512 } from '~/server/utils/hmac'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const signature = getHeader(event, 'x-paystack-signature')
  const expected = await createHmacSha512(JSON.stringify(body), config.paystackSecretKey)

  if (signature !== expected) {
    return sendError(event, createError({ statusCode: 401 }))
  }

  // Process webhook...
})
```

### XSS Prevention

- [ ] Product descriptions rendered safely (no raw HTML from users)
- [ ] Review titles/comments escaped before display
- [ ] No `v-html` with user-generated content

```vue
<!-- ✅ CORRECT — Text interpolation auto-escapes -->
<p>{{ product.description }}</p>

<!-- ❌ WRONG — v-html with user input allows XSS -->
<div v-html="product.description"></div>

<!-- ❌ WRONG — Unescaped review content -->
<div v-html="review.comment"></div>
```

### CSRF Protection

- [ ] State-changing endpoints use POST/PUT/DELETE (not GET)
- [ ] Session cookies are `HttpOnly` and `Secure` (handled by nuxt-auth-utils)
- [ ] Paystack callbacks use verification, not just callback URL trust

```ts
// ✅ CORRECT — State changes use POST
export default defineEventHandler(async (event) => {
  // This is a POST handler
  const body = await readValidatedBody(event, schema.parse)
  // ...
})

// ❌ WRONG — State change via GET
export default defineEventHandler(async (event) => {
  const { id } = getQuery(event)
  await deleteProduct(id)  // CSRF vulnerability!
})
```

### File Upload Security

- [ ] File type validated (images only: jpg, png, webp)
- [ ] File size limited
- [ ] Filename sanitized (no path traversal)
- [ ] Content-Type validated against file magic bytes

```ts
// ✅ CORRECT — Validate file type and generate safe filename
export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  const file = formData?.find(f => f.name === 'file')

  if (!file || !file.type?.startsWith('image/')) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Invalid file' }))
  }

  // Generate safe filename — no user input in path
  const key = `products/${Date.now()}-${nanoid(8)}.${file.type.split('/')[1]}`
})

// ❌ WRONG — User-controlled filename
const key = `products/${file.filename}`  // Path traversal risk!
```

### Rate Limiting

- [ ] Login endpoints have rate limiting
- [ ] Order initiation has rate limiting (prevent abuse)
- [ ] Review submission has rate limiting
- [ ] File upload has rate limiting

```ts
// Rate limiting pattern (to be implemented)
// Use nitro-cloudflare-dev or a custom rate limiter
const rateLimit = defineEventHandler(async (event) => {
  const ip = getRequestIP(event)
  const key = `ratelimit:login:${ip}`
  // Check Redis/memory store for request count
  // Return 429 if exceeded
})
```

### Inventory / Financial Integrity

- [ ] Stock reservations are atomic (handled by RivetKit inventoryActor)
- [ ] Prices can't be manipulated by client (server recalculates everything)
- [ ] Discount codes validated server-side (not trusted from client)
- [ ] Order totals recalculated on server, not trusted from client

```ts
// ✅ CORRECT — Server recalculates everything
export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, initiateOrderSchema.parse)

  // Recalculate subtotal from items (don't trust client total)
  const subtotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Validate discount server-side
  let discountAmount = 0
  if (body.discountCode) {
    const dc = await discountCodes.findOne({ code: body.discountCode.toUpperCase() })
    // ... validate expiry, usage limits, restrictions
  }

  const total = Math.max(0, subtotal - discountAmount)
})

// ❌ WRONG — Trusting client-calculated total
const total = body.total  // Client could send total: 0!
```

### Environment Variables

- [ ] No secrets in client-side code
- [ ] Runtime config properly separates public vs server-only
- [ ] `.env` file in `.gitignore`
- [ ] No secrets logged to console

```ts
// ✅ CORRECT — Server-only secrets in runtimeConfig
// nuxt.config.ts
runtimeConfig: {
  paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,  // Server-only
  public: {
    baseUrl: process.env.NUXT_PUBLIC_SITE_URL,         // Public
  }
}

// ❌ WRONG — Secret exposed to client
runtimeConfig: {
  public: {
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY  // ⚠️ Client can see this!
  }
}
```

### CORS

- [ ] Admin API routes don't have permissive CORS
- [ ] Webhook endpoints accept requests from known origins (Paystack)

```ts
// Nitro handles CORS via nuxt.config.ts routeRules
// Admin routes should NOT have CORS enabled
```

### Session Security

- [ ] Session password is strong and rotated
- [ ] Sessions expire after inactivity
- [ ] Secure flag set on cookies (production)
- [ ] SameSite attribute on cookies

```ts
// nuxt-auth-utils handles this via NUXT_SESSION_PASSWORD
// Ensure password is: 32+ chars, random, not committed to git
```

### Actor Security

- [ ] Actor actions validate inputs
- [ ] Queue payloads validated before processing
- [ ] No sensitive data in actor state logs

```ts
// ✅ CORRECT — Validate in actor action
actions: {
  reserve: (c, productId: string, qty: number) => {
    if (qty <= 0) throw new UserError('Invalid quantity')
    if (!productId.match(/^[a-f\d]{24}$/i)) throw new UserError('Invalid product ID')
    // ...
  }
}
```

## Common Vulnerabilities to Check

| Vulnerability | Location to Check | Mitigation |
|--------------|-------------------|------------|
| NoSQL Injection | API routes with MongoDB queries | Zod validation + parameterized queries |
| XSS | Product descriptions, reviews, user names | Auto-escape in Vue templates |
| CSRF | State-changing GET endpoints | Use POST/PUT/DELETE only |
| IDOR | Order detail pages, review endpoints | Verify ownership/guestEmail match |
| File upload | `/api/images/upload` | Type validation, safe filenames, size limits |
| Replay attacks | Paystack webhooks | HMAC verification + idempotent processing |
| Race conditions | Inventory reservations | Atomic actor operations |
| Mass assignment | Product/Order updates | Explicit field allowlists in Zod schemas |

## Do NOT

- Trust any client-provided totals, prices, or discounts
- Use `v-html` with user-generated content
- Allow raw user input in MongoDB queries without validation
- Log sensitive data (payment references, API keys, session tokens)
- Skip HMAC verification on webhooks
- Allow unrestricted file uploads
- Use GET requests for state-changing operations
- Expose server secrets in client-side code
- Trust callback URLs for payment verification (verify with API)

## Reference Files

- Admin middleware: `server/middleware/admin.ts`
- Paystack webhook: `server/api/webhooks/paystack.post.ts`
- HMAC utility: `server/utils/hmac.ts`
- Image upload: `server/api/images/upload.post.ts`
- Order initiation: `server/api/orders/initiate.post.ts`
- Nuxt config (runtimeConfig): `nuxt.config.ts`