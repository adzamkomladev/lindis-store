---
name: lindis-frontend
description: >-
  Frontend patterns and conventions for the Lindi's Store storefront.
  Load when creating or modifying storefront pages, Vue components,
  composables, layouts, or navigation.
---

# Storefront Frontend — Lindi's Store

Context skill for building customer-facing pages and components.

> **Announce:** "I'm loading lindis-frontend context for storefront development."

## Key Facts

- **Framework**: Nuxt 4 with `app/` as srcDir
- **UI**: shadcn-vue + TailwindCSS 4 + reka-ui
- **Icons**: `<Icon name="lucide:..." />` (via Nuxt Icon)
- **Forms**: vee-validate + zod (see `.agent/vee-validate-zod`)
- **Currency**: GHS — all prices in pesewas internally, formatted for display
- **Cart**: Client-side `useCart()` composable with localStorage persistence
- **Auth**: Admin-only (storefront is public, no customer accounts)

## Import Conventions

Nuxt 4 uses `app/` as the source directory:

```
~/  → app/          (e.g., ~/components/ui/Button.vue)
~~/ → project root  (e.g., ~~/schemas/product.schema.ts)
```

**In pages and components** (auto-resolved):
```ts
// Components — auto-imported by Nuxt
// No need to import UI components, just use them in <template>

// Composables — auto-imported
const { cart, addToCart } = useCart()
const { loggedIn, login } = useAuth()

// Server utils — auto-imported in server files only
// (NOT available in frontend components)
```

**In server files** (auto-imported):
```ts
// server/utils/* are auto-imported — never manually import them
usePaystack()    // ✓ auto-imported
useRivet()       // ✓ auto-imported
useR2()          // ✓ auto-imported
collections()    // ✓ auto-imported
```

**Explicit imports** (must be manual):
```ts
// Zod schemas — always from root
import { productSchema } from '~~/schemas/product.schema'

// Types — always from root
import type { CartItem } from '~~/types/cart'

// RivetKit client — explicit import in server files
import { useRivet } from '~/server/rivet/client'

// Third-party libraries — always import
import { nanoid } from 'nanoid'
import { toTypedSchema } from '@vee-validate/zod'
```

## Page Routing

```
app/pages/
├── index.vue                      # Home page
├── products/
│   ├── index.vue                  # Product listing
│   └── [slug].vue                 # Product detail
├── cart.vue                       # Shopping cart
├── checkout.vue                   # Checkout flow
├── orders/
│   ├── [id].vue                   # Order status page
│   └── success.vue                # Order confirmation
└── review/
    └── [token].vue                # Review submission
```

### Dynamic Routes
```ts
// app/pages/products/[slug].vue
const route = useRoute()
const slug = route.params.slug as string
const { data: product } = await useFetch(`/api/products/${slug}`)
```

## Composables

### `useCart()` — Client-side cart
```ts
const { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount } = useCart()

// Add product to cart
addToCart(product, 1)  // product object with _id, name, slug, price, images

// Remove from cart
removeFromCart(productId)

// Update quantity
updateQuantity(productId, 3)

// Computed totals (in pesewas)
cartTotal.value  // total price in pesewas
cartCount.value  // total item count

// Clear cart after checkout
clearCart()
```

**Cart is persisted in localStorage** under key `lindis-store-cart`. It loads on mount and watches for changes.

### `useAuth()` — Admin auth
```ts
const { loggedIn, user, login, logout } = useAuth()

// Login
await login({ email: 'admin@example.com', password: 'password' })

// Check if logged in
if (loggedIn.value) { ... }

// Access user
user.value?.email
user.value?.role  // 'admin' | 'customer'

// Logout
await logout()  // Clears session, redirects to /admin/login
```

### `useRivet()` — RivetKit client (server-side only)
```ts
// Only used in server API routes, NOT in frontend components
const rivet = useRivet()
const products = await rivet.catalogActor.getOrCreate(['main']).getProducts()
```

## Editorial Design System

### Typography
```css
/* Font families (loaded from Google Fonts) */
font-headline: 'Noto Serif'      /* Bold italic headlines */
font-label: 'Manrope'             /* Uppercase tracking labels */
font-body: 'Manrope'              /* Body copy */

/* Google Fonts import in nuxt.config.ts */
/* Noto Serif: 400-900 (italics), Manrope: 400-700 */
```

### Usage Patterns
```vue
<!-- Headlines — Noto Serif, medium italic -->
<h2 class="font-headline font-medium italic text-5xl text-on-surface tracking-tight">
  Where Heritage Meets the Modern Kitchen
</h2>

<!-- Labels — Manrope, uppercase tracking -->
<span class="font-label text-[10px] uppercase font-bold text-secondary tracking-widest">
  New Arrivals
</span>

<!-- Body — Manrope, regular -->
<p class="font-body text-on-surface-variant leading-relaxed">
  Curating timeless pieces for the modern kitchen.
</p>

<!-- Large numeric display -->
<span class="font-headline text-secondary text-9xl font-black">
  1
</span>
```

### Color Palette (Storefront)
```css
/* Primary and accent colors */
--primary: var(--color-primary)           /* Deep navy/indigo */
--secondary: var(--color-secondary)       /* Warm terracotta/copper */
--on-surface: var(--color-on-surface)     /* Dark text */
--on-surface-variant: var(--color-on-svariant) /* Muted text */
--outline-variant: var(--color-outlinevariant) /* Borders */

/* Theme colors used in homepage */
--dark-bg: #111111                       /* Hero backgrounds */
--warm-brown: #904b36                    /* Baking category */
--warm-orange: #e46a3d                   /* Utensils category */
--light-gray: #f0f0f0                    /* Light backgrounds */
--deep-teal: #1f404d                     /* Featured section */
```

### Button Hierarchy
```vue
<!-- Primary — monolith gradient or solid background -->
<button class="btn-primary inline-flex items-center px-8 py-4 rounded-md font-label uppercase text-xs font-bold tracking-widest text-white">
  Discover the Set
</button>

<!-- Secondary — outline or muted background -->
<a href="/products" class="font-label text-xs uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors">
  View All Collections
</a>

<!-- Tertiary — text link style -->
<NuxtLink to="/cart" class="text-primary hover:underline">View Cart</NuxtLink>
```

### Spacing and Layout
```vue
<!-- Max width container -->
<div class="max-w-screen-2xl mx-auto py-20 border-b border-outline-variant/20">
  <!-- Content -->
</div>

<!-- Asymmetric hero grid -->
<div class="flex flex-col lg:flex-row gap-16 items-center">
  <div class="w-full lg:w-1/2"><!-- Visual --></div>
  <div class="w-full lg:w-1/2 max-w-lg"><!-- Text --></div>
</div>

<!-- Product grid -->
<div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
  <!-- Product cards -->
</div>

<!-- Section spacing -->
<section class="py-20 border-t border-outline-variant/20">
```

## Product Display Patterns

### Product Card
```vue
<NuxtLink :to="`/products/${product.slug}`" class="group block">
  <div class="bg-[#111111] aspect-[4/5] rounded-xl flex items-center justify-center p-8 mb-4 overflow-hidden transition-transform group-hover:-translate-y-1">
    <NuxtImg :src="product.images[0]" :alt="product.name" class="w-full h-full object-cover" />
  </div>
  <h3 class="font-headline font-bold text-lg mb-1">{{ product.name }}</h3>
  <p class="font-body text-sm text-on-surface-variant">{{ formatCurrency(product.price) }}</p>
</NuxtLink>
```

### Price Formatting
```ts
// Utility for displaying prices (pesewas → GHS)
const formatCurrency = (pesewas: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(pesewas / 100)
}

// In templates:
// {{ formatCurrency(product.price) }}
// "GHS 25.50"
```

### Product Gallery (Detail Page)
```vue
<ProductGallery :images="product.images" />
```

### Product Info (Detail Page)
```vue
<ProductInfo :product="product" />
```

### Related Products
```vue
<RelatedProducts :product="product" :products="relatedProducts" />
```

## Image Handling

### R2 Image Proxy
Product images are served through an R2 proxy route:
```
/api/images/{pathname}  →  Cloudflare R2 bucket
```

### NuxtImg Component
```vue
<NuxtImg
  :src="product.images[0]"
  :alt="product.name"
  class="w-full h-full object-cover"
  loading="lazy"
  width="400"
  height="500"
/>
```

### Image Upload (Admin)
```ts
const formData = new FormData()
formData.append('file', selectedFile)
const { url } = await $fetch('/api/images/upload', {
  method: 'POST',
  body: formData,
})
// url is the public R2 URL
```

## SEO Pattern

```ts
// In page <script setup>
useSeoMeta({
  title: "Product Name | Lindi's Store",
  description: 'Product description goes here.',
  ogTitle: "Product Name | Lindi's Store",
  ogDescription: 'Product description goes here.',
  ogImage: product.images[0],
})
```

## Data Fetching Patterns

### Product Listing (SSR)
```ts
const route = useRoute()
const { data: products } = await useFetch('/api/products', {
  query: computed(() => ({
    category: route.query.category,
    status: 'active',
  })),
})
```

### Product Detail (SSR)
```ts
const { data: product } = await useFetch(`/api/products/${slug}`)
```

### Featured Products
```ts
const { data: featuredProducts } = await useFetch('/api/products/featured')
```

### Cart Operations (Client-side)
```ts
// No API calls — cart is client-side
const { addToCart } = useCart()
addToCart(product, 1)
```

### Checkout (API call)
```ts
const result = await $fetch('/api/orders/initiate', {
  method: 'POST',
  body: {
    email: formValues.email,
    name: formValues.name,
    address: formValues.address,
    city: formValues.city,
    phone: formValues.phone,
    items: cart.value.items.map(item => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      price: item.price,
      quantity: item.quantity,
      images: item.image ? [item.image] : [],
    })),
    discountCode: appliedDiscount?.code,
  },
})

// Redirect to Paystack
navigateTo(result.url, { external: true })
```

## Component Organization

```
app/components/
├── ui/                    # shadcn-vue primitives (do not modify directly)
│   ├── button/
│   ├── card/
│   ├── input/
│   ├── select/
│   ├── table/
│   └── ...
├── admin/                 # Admin-specific components
│   ├── AdminHeader.vue
│   ├── AdminSidebar.vue
│   ├── AdminStatsCard.vue
│   └── RevenueChart.vue
├── products/              # Product display components
│   ├── ProductCard.vue
│   ├── ProductFilters.vue
│   ├── ProductTabs.vue
│   ├── ProductsToolbar.vue
│   ├── ProductsEmpty.vue
│   └── RelatedProducts.vue
├── cart/                  # Cart components
│   ├── CartItem.vue
│   ├── CartEmpty.vue
│   └── CartSummary.vue
├── checkout/              # Checkout components
│   ├── CheckoutForm.vue
│   └── CheckoutItems.vue
├── home/                  # Homepage sections (auto-imported)
│   ├── HeroSection.vue
│   ├── FeaturedProducts.vue
│   ├── FeaturesSection.vue
│   ├── TestimonialsSection.vue
│   ├── BrandStorySection.vue
│   └── CtaSection.vue
├── AppHeader.vue          # Storefront header
├── AppFooter.vue          # Storefront footer
├── PromoBanner.vue        # Promo banner
├── ProductGallery.vue     # Product image gallery
├── ProductInfo.vue        # Product detail info
└── DataTable.vue          # Reusable data table
```

## Responsive Design

The storefront follows a mobile-first approach:

```vue
<!-- Mobile: single column, Desktop: grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

<!-- Mobile: hidden, Desktop: visible -->
<div class="hidden md:block">

<!-- Mobile: full width, Desktop: sidebar layout -->
<div class="flex flex-col lg:flex-row gap-16">
  <div class="w-full lg:w-1/2">...</div>
  <div class="w-full lg:w-1/2">...</div>
</div>

<!-- Container width -->
<div class="max-w-screen-2xl mx-auto px-4 sm:px-8">

<!-- Responsive padding -->
<div class="py-20 px-4 sm:px-8">
```

## Checkout Flow

```
Cart Page → Checkout Page → Paystack Redirect → Order Success Page
```

1. **Cart Page** (`/cart`) — Display items, calculate totals, apply discount
2. **Checkout Page** (`/checkout`) — Shipping details + payment initiation
3. **Paystack** — External payment (redirect via `authorization_url`)
4. **Verify** (`/api/orders/verify`) — Paystack callback confirms payment
5. **Success** (`/orders/success`) — Order confirmation page
6. **Review** (`/review/[token]`) — 7 days later, email with review link

## Do NOT

- Use `~/server/` paths in frontend components (use API routes instead)
- Forget to convert pesewas to GHS when displaying prices
- Use `useRivet()` in frontend components (it's server-only)
- Create customer accounts (the system uses guest checkout only)
- Forget `definePageMeta` for layout specification
- Mix admin and storefront components (keep them in separate directories)
- Hardcode image URLs — use R2 or the `/api/images/` proxy
- Forget `loading="lazy"` on product images for performance
- Use client-only state for SSR-critical data (use `useFetch` for SSR data)

## Reference Files

- Homepage: `app/pages/index.vue`
- Products listing: `app/pages/products/index.vue`
- Product detail: `app/pages/products/[slug].vue`
- Cart: `app/pages/cart.vue`
- Checkout: `app/pages/checkout.vue`
- Cart composable: `app/composables/useCart.ts`
- Auth composable: `app/composables/auth.ts`
- Alert dialog: `app/composables/useAlertDialog.ts`
- Product card: `app/components/products/ProductCard.vue`
- Cart summary: `app/components/cart/CartSummary.vue`
- Checkout form: `app/components/checkout/CheckoutForm.vue`
- Nuxt config: `nuxt.config.ts`
- Cart types: `types/cart.ts`