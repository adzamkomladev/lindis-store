# Lindi's Store — Project Context

## Stack

- **Frontend**: Nuxt 4 (Vue 3), TailwindCSS 4, shadcn-vue, reka-ui, vee-validate + zod
- **Backend**: Nitro server, RivetKit actors, MongoDB
- **Payments**: Paystack (GHS)
- **Email**: Maileroo (templated emails)
- **Storage**: Cloudflare R2 (product images)
- **Auth**: nuxt-auth-utils (session-based)

## Critical Conventions

- **Prices**: All monetary values stored as pesewas (GHS × 100, integers). Display by dividing by 100.
- **ObjectIDs**: MongoDB ObjectIDs transported as 24-char hex strings. Validate with `z.string().regex(/^[a-f\d]{24}$/i)`.
- **Order numbers**: Format `ls-{nanoid(8).toLowerCase()}`
- **Guest checkout**: No user account required for orders. Orders use `guestEmail`.
- **Nuxt 4 paths**: `~/` = `app/`, `~~/` = project root. Server files use `~~/schemas`, `~~/types`.
- **Auto-imported utils**: Never manually import from `server/utils/*` — they are auto-imported.
- **Admin auth**: Middleware on `/api/admin/**` checks `getUserSession(event).user.role === 'admin'`.
- **Actor keys**: Singleton actors use `['main']`, per-entity actors use `[orderId]`.
- **Zod schemas**: Live in `schemas/` directory, not inline in components.

## Environment Variables

```
MONGODB_URI            — MongoDB connection string
MONGODB_DB_NAME        — Database name (default: lindis-store)
RIVET_ENDPOINT         — Rivet Engine private endpoint (format: https://namespace:token@host)
RIVET_PUBLIC_ENDPOINT  — Rivet Engine public endpoint for client-side connections (same URL for self-hosted)
PAYSTACK_SECRET_KEY    — Paystack API secret
R2_ACCOUNT_ID          — Cloudflare R2 account
R2_ACCESS_KEY_ID       — R2 access key
R2_SECRET_ACCESS_KEY   — R2 secret key
R2_BUCKET_NAME          — R2 bucket name
R2_PUBLIC_URL           — R2 public URL for images
NUXT_SESSION_PASSWORD   — Session encryption key
MAILEROO_API_KEY        — Maileroo API key
MAILEROO_FROM_EMAIL     — Sender email
MAILEROO_FROM_NAME      — Sender name
NUXT_PUBLIC_SITE_URL    — Public site URL (default: http://localhost:3000)
```

## Key Directories

```
app/                    — Frontend (pages, components, composables, layouts)
app/pages/admin/        — Admin panel pages
app/components/         — Vue components (ui/, admin/, products/, cart/, checkout/)
app/composables/        — useCart, useAuth, useAlertDialog
server/api/             — Nitro API routes
server/api/admin/       — Admin-only API routes
server/rivet/actors/    — RivetKit actors (9 actors)
server/rivet/           — registry.ts + client.ts
server/db/              — MongoDB connection, collections, types, indexes
server/utils/           — Auto-imported utilities (paystack, email, queues, hmac, r2)
server/middleware/       — admin.ts (auth guard)
schemas/                — Zod validation schemas
types/                  — Shared TypeScript types
```

## Related Skills

- `.agent/lindis-store-context` — Architecture deep-dive
- `.agent/lindis-api-endpoints` — Server API patterns
- `.agent/lindis-ecommerce-domain` — Business logic & flows
- `.agent/lindis-rivet-actors` — Actor system reference
- `.agent/lindis-admin-panel` — Admin UI patterns
- `.agent/lindis-frontend` — Storefront patterns
- `.agent/shadcn-vue` — UI component library
- `.agent/vee-validate-zod` — Form validation
- `.agent/ui-design-basics` — Design principles