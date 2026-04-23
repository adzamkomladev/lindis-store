---
name: server-api
description: >-
  Context and patterns for building Nuxt 4 server API endpoints.
  Load when creating, modifying, or debugging API routes in server/api.
---

# Server API Development

Context skill for building API endpoints in this Nuxt 4 + NuxtHub project.

> **Announce:** "I'm loading server-api context for API development."

## Key Facts

- **Framework**: Nuxt 4 with Nitro on Cloudflare Workers
- **Database**: Drizzle ORM + Cloudflare D1 via NuxtHub
- **Auth**: nuxt-auth-utils
- **Validation**: Zod schemas from `schemas/` directory
- **Auto-imports**: `server/utils/*` are auto-imported (DO NOT manually import)

## API Endpoint Structure

```ts
// server/api/[domain]/[resource]/index.post.ts
import { mySchema } from "~~/schemas/domain/resource";

export default defineEventHandler(async (event) => {
  // 1. Authentication
  const { user } = await requireUserSession(event);

  // 2. Validation
  const body = await readValidatedBody(event, mySchema.parse);

  // 3. Database operations
  try {
    const { db } = await import("@nuxthub/db");

    const result = await db.transaction(async (tx) => {
      // ... transactional operations
      return { data: result };
    });

    return { success: true, ...result };
  } catch (error) {
    // Re-throw HTTP errors
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    console.error("Error:", error);
    return sendError(
      event,
      createError({
        statusCode: 500,
        statusMessage: "It's not you, it's us. Kindly try again later!",
      }),
    );
  }
});
```

## Authentication

```ts
// Get current authenticated user
const { user } = await requireUserSession(event);

// Access user properties
user.id          // User ID
user.email       // Email
user.role        // 'admin' | 'affiliate' | 'client'
user.selected    // Selected team context { teamId, role }
```

## Validation Patterns

```ts
// Body validation
const body = await readValidatedBody(event, schema.parse);

// Query validation
const query = await getValidatedQuery(event, querySchema.parse);

// Route params
const id = getRouterParam(event, 'id');
```

## Error Handling

```ts
// Return client-friendly errors
return sendError(
  event,
  createError({
    statusCode: 400,
    statusMessage: "Product slug is already in use",
  }),
);

// Common status codes:
// 400 - Bad Request (validation, duplicate, etc.)
// 401 - Unauthorized
// 403 - Forbidden (no permission)
// 404 - Not Found
// 500 - Server Error
```

## Database Operations

```ts
import { db, schema } from '@nuxthub/db';

// Simple queries
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.id, userId),
});

// Transactions
await db.transaction(async (tx) => {
  const [created] = await tx
    .insert(schema.orders)
    .values({ ... })
    .returning();

  await tx
    .update(schema.wallets)
    .set({ balance: sql`${schema.wallets.balance} + ${amount}` })
    .where(eq(schema.wallets.id, walletId));
});
```

## Caching

```ts
// Invalidate cache after mutations
await invalidateCacheEntry({ name: "authProfile", key: user.id });
await invalidateCacheEntry({ name: "productDetails", key: productId });
```

## File Organization

```
server/api/
├── admin/           # Admin endpoints
├── affiliate/       # Affiliate dashboard endpoints
├── organizer/       # Event organizer endpoints
├── onboarding/      # Onboarding flow
├── payments/        # Payment webhooks
├── profile/         # User profile
├── webhooks/        # External webhooks
└── website/         # Public website endpoints
```

## Do NOT

- Import from `server/utils/*` manually (they're auto-imported)
- Use custom auth helpers - use `requireUserSession(event)` instead

## Reference Files

- Example POST endpoint: `server/api/admin/products/index.post.ts`
- Cache utilities: `server/utils/cache.ts`
- ID generators: `server/utils/ids.ts`
