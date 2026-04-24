---
name: lindis-frontend-cleaner
description: >-
  Code quality, refactoring, and performance optimization for the Lindi's Store
  storefront. Load when cleaning up Vue components, improving performance,
  removing dead code, or refactoring frontend code.
---

# Frontend Cleaner — Lindi's Store

Code quality and refactoring skill for the Vue 3 + Nuxt 4 storefront.

> **Announce:** "I'm loading lindis-frontend-cleaner context for code quality."

## Key Facts

- **Framework**: Vue 3 Composition API + Nuxt 4
- **Styling**: TailwindCSS 4 with custom theme tokens
- **Components**: shadcn-vue + custom domain components
- **State**: `useState` for SSR-safe state, `localStorage` for cart persistence
- **Images**: `@nuxt/image` for optimization, R2 for storage

## Code Quality Checklist

### Vue Component Structure

```vue
<script setup lang="ts">
// 1. Imports (explicit only — auto-imported composables/components don't need imports)
import { toTypedSchema } from '@vee-validate/zod'
import type { ProductDoc } from '~~/types/product'

// 2. Props
const props = defineProps<{
  product: ProductDoc
  featured?: boolean
}>()

// 3. Emits
defineEmits<{
  addToCart: [product: ProductDoc, quantity: number]
}>()

// 4. Composables (auto-imported, no import needed)
const { cart } = useCart()
const route = useRoute()

// 5. Reactive state
const quantity = ref(1)
const isLoading = ref(false)

// 6. Computed
const formattedPrice = computed(() => formatCurrency(props.product.price))

// 7. Watchers
watch(quantity, (newQty) => {
  if (newQty < 1) quantity.value = 1
})

// 8. Methods
const handleAddToCart = async () => {
  isLoading.value = true
  try {
    await addToCart(props.product, quantity.value)
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <!-- Template -->
</template>
```

### Remove Unused Imports

```vue
<!-- ❌ WRONG — Unused imports -->
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'  // Only using ref
import { Button } from '@/components/ui/button'        // Auto-imported, not needed
import { useCart } from '~/composables/useCart'        // Auto-imported, not needed

const count = ref(0)
</script>

<!-- ✅ CORRECT — Only import what's needed and not auto-imported -->
<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'  // Third-party, must import
</script>
```

### Extract Reusable Logic into Composables

```ts
// ❌ WRONG — Repeated logic in multiple components
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(price / 100)
}

// ✅ CORRECT — Extract to composable
// app/composables/useCurrency.ts
export const useCurrency = () => {
  const format = (pesewas: number) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
    }).format(pesewas / 100)
  }
  return { format }
}

// Usage in component
const { format: formatCurrency } = useCurrency()
```

### Split Large Components

```vue
<!-- ❌ WRONG — 400+ line component -->
<!-- ProductDetail.vue with gallery, info, reviews, related products -->

<!-- ✅ CORRECT — Split into focused components -->
<!-- ProductDetail.vue -->
<template>
  <div>
    <ProductGallery :images="product.images" />
    <ProductInfo :product="product" />
    <ProductTabs :product="product" />
    <RelatedProducts :products="relatedProducts" />
  </div>
</template>
```

## Performance Optimization

### Image Optimization

```vue
<!-- ❌ WRONG — Unoptimized images -->
<img src="product-image.jpg" class="w-full" />

<!-- ✅ CORRECT — NuxtImg with proper attributes -->
<NuxtImg
  :src="product.images[0]"
  :alt="product.name"
  width="400"
  height="500"
  loading="lazy"
  placeholder
  class="w-full h-full object-cover"
/>

<!-- For above-the-fold (hero images) -->
<NuxtImg
  src="/storefront_hero_kitchen.png"
  alt="Hero"
  width="1200"
  height="600"
  priority              <!-- Don't lazy-load hero images -->
  class="w-full"
/>
```

### Prevent Unnecessary Re-renders

```vue
<script setup lang="ts">
// ❌ WRONG — Object/array reactivity causing unnecessary updates
const items = ref([])
items.value = [...items.value, newItem]  // Triggers re-render of entire list

// ✅ CORRECT — Use shallowRef for large lists that don't need deep reactivity
const items = shallowRef([])

// ❌ WRONG — Computed with expensive operations
const filteredProducts = computed(() => {
  return products.value
    .filter(p => p.status === 'active')
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(p => ({ ...p, formattedPrice: formatCurrency(p.price) }))
})

// ✅ CORRECT — Memoize expensive computations
const filteredProducts = computed(() => {
  const active = products.value.filter(p => p.status === 'active')
  active.sort((a, b) => b.createdAt - a.createdAt)
  return active
})

const formattedPrice = (price: number) => formatCurrency(price)  // Format in template
</script>
```

### Use `v-once` for Static Content

```vue
<!-- ✅ CORRECT — Content that never changes -->
<footer v-once>
  <p>&copy; 2024 Lindi's Store. All rights reserved.</p>
</footer>
```

### Optimize Event Handlers

```vue
<script setup lang="ts">
// ❌ WRONG — Inline arrow functions in template (recreated every render)
</script>

<template>
  <button @click="() => addToCart(product, 1)">Add</button>
</template>

<script setup lang="ts">
// ✅ CORRECT — Named methods (stable reference)
const handleAdd = () => addToCart(product, 1)
</script>

<template>
  <button @click="handleAdd">Add</button>
</template>
```

### Lazy Load Heavy Components

```vue
<script setup lang="ts">
// ✅ CORRECT — Lazy load below-the-fold components
const ProductReviews = defineAsyncComponent(() =>
  import('~/components/products/ProductReviews.vue')
)
</script>

<template>
  <div>
    <ProductInfo :product="product" />
    <ProductReviews :product="product" />  <!-- Loaded only when needed -->
  </div>
</template>
```

## TailwindCSS Optimization

### Remove Unused Classes

```vue
<!-- ❌ WRONG — Unused/duplicate classes -->
<div class="flex flex-row items-center justify-between p-4 px-4 py-4 m-0">
  <!-- px-4 and py-4 override p-4 — redundant -->
  <!-- flex-row is default — unnecessary -->
  <!-- m-0 is default — unnecessary -->
</div>

<!-- ✅ CORRECT — Minimal, purposeful classes -->
<div class="flex items-center justify-between p-4">
</div>
```

### Use Design System Tokens

```vue
<!-- ❌ WRONG — Hardcoded colors -->
<div class="bg-[#000622] text-white">

<!-- ✅ CORRECT — Semantic tokens -->
<div class="bg-primary text-primary-foreground">
```

### Responsive Classes Order

```vue
<!-- ✅ CORRECT — Mobile-first, ascending breakpoint order -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
  <!-- Mobile: 1 column, gap-4 -->
  <!-- sm: 2 columns -->
  <!-- md: gap-6 -->
  <!-- lg: 4 columns -->
</div>
```

## Remove Dead Code

### Unused Components
Check for components not imported anywhere:
```bash
# Check if component is used
grep -r "ProductCardOld" app/
# If no results, safe to delete
```

### Unused Composables
```ts
// ❌ WRONG — Composable defined but never used
// app/composables/useOldFeature.ts
export const useOldFeature = () => { ... }

// ✅ CORRECT — Remove if not used anywhere
```

### Unused API Routes
```ts
// ❌ WRONG — API route that serves no purpose
// server/api/old-endpoint.get.ts
export default defineEventHandler(() => {
  return { message: 'deprecated' }
})
```

### Unused Dependencies
```bash
# Check package.json for unused packages
# Remove if not imported anywhere in the codebase
```

## Accessibility Improvements

### Image Alt Text
```vue
<!-- ❌ WRONG -->
<NuxtImg :src="product.images[0]" />

<!-- ✅ CORRECT -->
<NuxtImg
  :src="product.images[0]"
  :alt="product.name"
/>
```

### Form Labels
```vue
<!-- ❌ WRONG -->
<input type="email" placeholder="Email" />

<!-- ✅ CORRECT -->
<label for="email">Email Address</label>
<input id="email" type="email" aria-required="true" />
```

### Button Accessibility
```vue
<!-- ❌ WRONG -->
<div @click="submit">Submit</div>

<!-- ✅ CORRECT -->
<button type="submit" :disabled="isSubmitting">
  <span v-if="isSubmitting">Submitting...</span>
  <span v-else>Submit</span>
</button>
```

### Focus Management
```vue
<!-- ✅ CORRECT — Visible focus states -->
<button class="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
  Click me
</button>
```

## Code Style Conventions

### Consistent Naming
```
Components: PascalCase (ProductCard.vue, AdminHeader.vue)
Composables: camelCase with use prefix (useCart.ts, useAuth.ts)
Pages: kebab-case ([slug].vue, discount-codes.vue)
Utilities: camelCase (formatCurrency, createSlug)
Constants: SCREAMING_SNAKE_CASE (MAX_CART_ITEMS, LOW_STOCK_THRESHOLD)
```

### Template Formatting
```vue
<!-- ✅ CORRECT — Consistent attribute ordering -->
<NuxtLink
  :to="`/products/${product.slug}`"
  class="group block"
  :aria-label="`View ${product.name}`"
>

<!-- ✅ CORRECT — Multi-line for complex templates -->
<div
  class="flex flex-col items-center justify-center p-8"
  :class="{
    'bg-primary': isActive,
    'bg-muted': !isActive,
  }"
  @click="handleClick"
>
```

### Script Organization
```vue
<script setup lang="ts">
// Order: imports → props → emits → composables → reactive state → computed → watchers → methods → lifecycle

// 1. Imports (only non-auto-imported)
import { toTypedSchema } from '@vee-validate/zod'

// 2. Props & Emits
defineProps<{ ... }>()
defineEmits<{ ... }>()

// 3. Composables
const route = useRoute()
const { cart } = useCart()

// 4. Reactive State
const isLoading = ref(false)

// 5. Computed
const isEmpty = computed(() => cart.value.items.length === 0)

// 6. Watchers
watch(isEmpty, (empty) => {
  if (empty) console.log('Cart is empty')
})

// 7. Methods
const handleSubmit = async () => { ... }

// 8. Lifecycle
onMounted(() => { ... })
</script>
```

## Do NOT

- Leave `console.log` statements in committed code
- Use `any` type without justification
- Import components that are auto-imported by Nuxt
- Use inline styles when Tailwind classes exist
- Nest components more than 3 levels deep without consideration
- Forget to add `key` to `v-for` loops
- Use `v-if` and `v-for` on the same element
- Leave commented-out code in files
- Use magic numbers without constants
- Forget to handle error states in async operations

## Reference Files

- Components: `app/components/**/*.vue`
- Composables: `app/composables/*.ts`
- Pages: `app/pages/**/*.vue`
- Tailwind config: `app/assets/css/tailwind.css`
- Nuxt config: `nuxt.config.ts`