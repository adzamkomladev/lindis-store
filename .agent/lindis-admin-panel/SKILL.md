---
name: lindis-admin-panel
description: >-
  Context and patterns for building admin panel pages in Lindi's Store.
  Load when creating, modifying, or debugging admin pages, components,
  or API routes under app/pages/admin/ or server/api/admin/.
---

# Admin Panel — Lindi's Store

Context skill for building admin pages and components in this project.

> **Announce:** "I'm loading lindis-admin-panel context for admin development."

## Key Facts

- **Layout**: `app/layouts/admin.vue` — sidebar (fixed 64rem on desktop) + header
- **Auth**: `useAuth()` composable wraps `useUserSession()`. Login at `/admin/login`.
- **Middleware**: `server/middleware/admin.ts` protects all `/api/admin/**` routes
- **UI Library**: shadcn-vue + reka-ui + TailwindCSS 4
- **Data Tables**: `@tanstack/vue-table` with custom `DataTable.vue` wrapper
- **Charts**: `@unovis/vue` + `@unovis/ts`
- **Forms**: vee-validate + zod (see `.agent/vee-validate-zod`)
- **Icons**: Lucide Icons via `<Icon name="lucide:..." />`

## Admin Page Structure

Every admin page must include `layout: 'admin'` in its route metadata:

```vue
<!-- app/pages/admin/products/index.vue -->
<script setup lang="ts">
definePageMeta({ layout: 'admin' })
// ... page logic
</script>
```

The only exception is the login page, which uses `layout: false`:
```vue
<!-- app/pages/admin/login.vue -->
<script setup lang="ts">
definePageMeta({ layout: false })
</script>
```

## Admin Layout Structure

```vue
<!-- app/layouts/admin.vue -->
<template>
  <div class="min-h-screen bg-[#f8f9fa]">
    <AdminSidebar />              <!-- Fixed left sidebar, 16rem (64) on desktop -->
    <div class="md:pl-64 min-h-screen flex flex-col">
      <AdminHeader />             <!-- Top bar with user menu -->
      <main class="flex-1 px-6 md:px-8">
        <slot />                  <!-- Page content -->
      </main>
    </div>
  </div>
</template>
```

## Admin Design System

### Colors
```css
--admin-bg-dark: #000622       /* Deep navy — sidebar, primary buttons */
--admin-bg-medium: #475d92      /* Medium blue — active sidebar items */
--admin-bg-light: #adc3fe       /* Light blue — hover states */
--admin-text-muted: #757681     /* Muted text */
--admin-border: #c5c6d1         /* Borders */
--admin-bg-gray-1: #edeeef      /* Card backgrounds (dark) */
--admin-bg-gray-2: #f3f4f5      /* Card backgrounds */
--admin-bg-gray-3: #f8f9fa      /* Page background */
```

### Typography Classes
```vue
<span class="font-headline font-bold">Section Title</span>    <!-- Bold headlines -->
<span class="font-label uppercase tracking-widest text-xs">Label</span>  <!-- Uppercase labels -->
<span class="font-body text-sm text-muted-foreground">Body text</span>   <!-- Body copy -->
```

### Primary Button Style
```vue
<button class="monolith-gradient text-white ...">Action</button>
```

The `monolith-gradient` class creates the project's signature gradient button.

## Admin Page Patterns

### List Page with Search, Filter, and Table

```vue
<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const search = ref('')
const status = ref<string>('all')
const page = ref(1)
const pageSize = 10

const { data, pending } = await useFetch('/api/admin/products', {
  query: { search, status, page, pageSize }
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="font-headline text-2xl font-bold">Products</h1>
        <p class="text-sm text-muted-foreground">{{ data?.total ?? 0 }} products</p>
      </div>
      <NuxtLink to="/admin/products/create">
        <Button class="monolith-gradient">
          <Icon name="lucide:plus" class="mr-2" /> Add Product
        </Button>
      </NuxtLink>
    </div>

    <!-- Filters -->
    <div class="flex gap-4 mb-6">
      <Input v-model="search" placeholder="Search products..." class="max-w-sm" />
      <Select v-model="status">
        <SelectTrigger class="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
          <SelectItem value="archived">Archived</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <!-- Table -->
    <DataTable v-if="data" :columns="columns" :data="data.products" />
  </div>
</template>
```

### Stats Card Pattern

```vue
<Card class="shadow-none border py-3 px-4">
  <CardHeader class="flex flex-row items-center justify-between p-0 pb-2">
    <CardTitle class="text-sm font-medium text-muted-foreground">
      Total Revenue
    </CardTitle>
    <Icon name="lucide:wallet" size="1.25em" class="text-emerald-500" />
  </CardHeader>
  <CardContent class="p-0">
    <div class="text-2xl font-bold">{{ formatCurrency(stats.revenue) }}</div>
    <p class="text-xs text-muted-foreground">+12% from last month</p>
  </CardContent>
</Card>
```

### Mobile-Responsive Toggle

Admin pages use a responsive pattern: card list on mobile, table on desktop:

```vue
<!-- Mobile: Card list -->
<div class="md:hidden space-y-4">
  <Card v-for="order in orders" :key="order._id" class="shadow-none border">
    <CardContent class="p-4">
      <!-- Mobile card layout -->
    </CardContent>
  </Card>
</div>

<!-- Desktop: Data table -->
<div class="hidden md:block">
  <DataTable :columns="columns" :data="orders" />
</div>
```

### Status Chip (Stat Chip) Pattern

```vue
<div class="flex gap-2">
  <button
    v-for="chip in statusChips"
    :key="chip.value"
    @click="status = chip.value"
    :class="[
      'px-3 py-1 rounded-full text-xs font-medium transition-colors',
      status === chip.value
        ? 'bg-primary text-white'
        : 'bg-muted text-muted-foreground hover:bg-muted/80'
    ]"
  >
    {{ chip.label }} ({{ chip.count }})
  </button>
</div>
```

## Form Patterns

### Create/Edit Form with vee-validate

```vue
<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { productSchema, type ProductInput } from '~~/schemas/product.schema'

definePageMeta({ layout: 'admin' })

const isSubmitting = ref(false)

const { handleSubmit, defineField, errors } = useForm<ProductInput>({
  validationSchema: toTypedSchema(productSchema),
  initialValues: {
    name: '',
    price: 0,
    inventoryCount: 0,
    status: 'draft',
    category: 'other',
  },
})

const [name, nameAttrs] = defineField('name')
const [price, priceAttrs] = defineField('price')
const [inventoryCount, inventoryCountAttrs] = defineField('inventoryCount')
const [category, categoryAttrs] = defineField('category')

const onSubmit = handleSubmit(async (values) => {
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/products', {
      method: 'POST',
      body: {
        ...values,
        price: Math.round(values.price * 100),  // Convert GHS to pesewas
      },
    })
    toast.success('Product created')
    navigateTo('/admin/products')
  } catch (error: any) {
    toast.error(error.data?.message || 'Failed to create product')
  } finally {
    isSubmitting.value = false
  }
})
</script>
```

### Edit Form (Pre-filled Values)

```vue
<script setup lang="ts">
const { data: product } = await useFetch(`/api/admin/products/${id}`)

// Convert pesewas to GHS for form display
const { handleSubmit, defineField, errors } = useForm({
  validationSchema: toTypedSchema(updateProductSchema),
  initialValues: {
    name: product.value.name,
    price: product.value.price / 100,  // Convert pesewas to GHS for display
    // ... other fields
  },
})
</script>
```

## Data Fetching Patterns

### List with Pagination
```ts
const page = ref(1)
const pageSize = ref(10)
const search = ref('')
const status = ref('all')

const { data, pending, refresh } = await useFetch('/api/admin/products', {
  query: computed(() => ({
    page: page.value,
    pageSize: pageSize.value,
    search: search.value || undefined,
    status: status.value !== 'all' ? status.value : undefined,
  })),
})
```

### Single Item Detail
```ts
const id = getRouterParam(event, 'id')
const { data: product } = await useFetch(`/api/admin/products/${id}`)
```

### Delete with Confirmation
```ts
const deleteProduct = async (id: string) => {
  await $fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
  toast.success('Product deleted')
  refresh() // Refresh the list
}
```

## Chart Pattern

Revenue charts use `@unovis/vue`:

```vue
<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis } from '@unovis/vue'

const { data: revenue } = await useFetch('/api/admin/revenue', {
  query: { period: selectedPeriod }
})

const x = (d: any, i: number) => i
const y = (d: any) => d.revenue
</script>

<template>
  <VisXYContainer :data="revenue" :x="x" :y="y">
    <VisLine />
    <VisAxis type="x" />
    <VisAxis type="y" />
  </VisXYContainer>
</template>
```

## Price Display in Admin

Always convert pesewas to GHS for display:
```ts
const formatCurrency = (pesewas: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(pesewas / 100)
}
```

On form submission, convert GHS back to pesewas:
```ts
body: {
  ...values,
  price: Math.round(values.price * 100),  // GHS → pesewas
}
```

## Admin API Routes

All admin API routes are in `server/api/admin/` and are automatically protected by `server/middleware/admin.ts`:

```
server/api/admin/
├── products/
│   ├── index.get.ts          # List all products (all statuses)
│   ├── index.post.ts          # Create product
│   └── [id]/
│       ├── index.get.ts       # Get single product
│       ├── index.put.ts       # Update product
│       └── index.delete.ts    # Delete product
├── orders/
│   ├── index.get.ts           # List orders with filters
│   ├── recent.get.ts          # Recent orders
│   └── [id]/
│       ├── index.get.ts       # Get single order
│       └── [id].put.ts        # Update order status
├── users/
│   ├── index.get.ts           # List users
│   └── [id]/
│       ├── [id].put.ts        # Update user
│       ├── [id].delete.ts     # Delete user
│       └── reset-password.post.ts
├── discount-codes/
│   ├── index.get.ts            # List discount codes
│   ├── index.post.ts           # Create discount code
│   └── [id]/
│       ├── [id].put.ts         # Update discount code
│       └── [id].delete.ts      # Delete discount code
├── payments/
│   └── index.get.ts            # List payments
├── settings/
│   ├── index.get.ts            # Get settings
│   └── index.put.ts            # Update settings
├── stats.get.ts                # Dashboard stats
└── revenue.get.ts              # Revenue chart data
```

## Admin Navigation (Sidebar)

```ts
const navItems = [
  { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/admin' },
  { label: 'Products', icon: 'lucide:package', to: '/admin/products' },
  { label: 'Orders', icon: 'lucide:shopping-bag', to: '/admin/orders' },
  { label: 'Users', icon: 'lucide:users', to: '/admin/users' },
  { label: 'Discount Codes', icon: 'lucide:percent', to: '/admin/discount-codes' },
  { label: 'Payments', icon: 'lucide:credit-card', to: '/admin/payments' },
  { label: 'Settings', icon: 'lucide:settings', to: '/admin/settings' },
]
```

## Authentication

### Login
```ts
const { login, loggedIn } = useAuth()

// Login handler
await login({ email, password })
// Redirects to /admin on success
```

### Logout
```ts
const { logout } = useAuth()
await logout()  // Calls POST /api/auth/logout, clears session, redirects to /admin/login
```

### Auth Composable
```ts
// app/composables/auth.ts
export const useAuth = () => {
  const { loggedIn, user, clear, fetch } = useUserSession()
  const login = async (credentials: any) => {
    await $fetch('/api/auth/login', { method: 'POST', body: credentials })
    await fetch()
  }
  const logout = async () => {
    await $fetch('/api/auth/logout', { method: 'POST' })
    await clear()
    navigateTo('/admin/login')
  }
  return { loggedIn, user, login, logout }
}
```

## Do NOT

- Forget `definePageMeta({ layout: 'admin' })` on admin pages
- Store or display prices in pesewas without converting (divide by 100 for display)
- Add admin auth checks manually in API handlers — the middleware handles it
- Use floating-point for price inputs — round to pesewas before sending to API
- Forget to handle loading/pending states in data fetching
- Create new admin API routes outside `server/api/admin/` (they won't be auth-protected)
- Use `requireUserSession()` in admin API handlers — the middleware already verifies auth

## Reference Files

- Admin layout: `app/layouts/admin.vue`
- Admin sidebar: `app/components/admin/AdminSidebar.vue`
- Admin header: `app/components/admin/AdminHeader.vue`
- Dashboard: `app/pages/admin/index.vue`
- Products list: `app/pages/admin/products/index.vue`
- Product create: `app/pages/admin/products/create.vue`
- Orders list: `app/pages/admin/orders/index.vue`
- Settings: `app/pages/admin/settings.vue`
- Login: `app/pages/admin/login.vue`
- Auth composable: `app/composables/auth.ts`
- Admin middleware: `server/middleware/admin.ts`
- Stats card: `app/components/admin/AdminStatsCard.vue`
- Revenue chart: `app/components/admin/RevenueChart.vue`