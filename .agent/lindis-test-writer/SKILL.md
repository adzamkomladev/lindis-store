---
name: lindis-test-writer
description: >-
  Test generation patterns for Lindi's Store. Load when writing tests for
  API routes, RivetKit actors, Vue components, or end-to-end flows.
---

# Test Writer — Lindi's Store

Testing skill for this Nuxt 4 + MongoDB + RivetKit e-commerce application.

> **Announce:** "I'm loading lindis-test-writer context for test development."

## Key Facts

- **Framework**: Vitest (via Nuxt test utils)
- **API Testing**: `nitro-test-utils` or direct fetch with test server
- **Component Testing**: `@vue/test-utils`
- **E2E Testing**: Playwright (recommended)
- **Database**: Test against real MongoDB or mock collections
- **Actors**: Mock RivetKit client or use test runner

## Test File Organization

```
tests/
├── unit/
│   ├── composables/
│   │   └── useCart.test.ts
│   ├── utils/
│   │   └── formatCurrency.test.ts
│   └── schemas/
│       └── product.schema.test.ts
├── integration/
│   ├── api/
│   │   ├── products.test.ts
│   │   ├── orders.test.ts
│   │   └── auth.test.ts
│   └── actors/
│       ├── catalog-actor.test.ts
│       └── inventory-actor.test.ts
└── e2e/
    ├── checkout-flow.spec.ts
    └── admin-panel.spec.ts
```

## API Route Testing

### Setup
```ts
// tests/integration/api/products.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils'

describe('Products API', async () => {
  await setup({
    // Nuxt test server config
  })

  // Or use direct Nitro handler testing
})
```

### Testing Public Endpoints
```ts
import { describe, it, expect } from 'vitest'

describe('GET /api/products', () => {
  it('returns active products', async () => {
    const products = await $fetch('/api/products')

    expect(products).toBeDefined()
    expect(Array.isArray(products)).toBe(true)
    expect(products.length).toBeGreaterThan(0)

    // Check product structure
    const product = products[0]
    expect(product).toHaveProperty('name')
    expect(product).toHaveProperty('slug')
    expect(product).toHaveProperty('price')
    expect(product).toHaveProperty('status', 'active')
    expect(product.price).toBeGreaterThan(0)  // Pesewas
  })

  it('filters by category', async () => {
    const products = await $fetch('/api/products', {
      query: { category: 'blenders' }
    })

    expect(products.every(p => p.category === 'blenders')).toBe(true)
  })
})
```

### Testing Admin Endpoints (Authenticated)
```ts
describe('POST /api/admin/products', () => {
  it('requires admin authentication', async () => {
    await expect($fetch('/api/admin/products', {
      method: 'POST',
      body: { name: 'Test Product' }
    })).rejects.toThrow(/403/)
  })

  it('creates product with valid data', async () => {
    // Login as admin first
    const session = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@test.com', password: 'password' }
    })

    const product = await $fetch('/api/admin/products', {
      method: 'POST',
      body: {
        name: 'Test Blender',
        price: 25000,  // Pesewas = GHS 250.00
        inventoryCount: 10,
        category: 'blenders',
      },
      headers: {
        cookie: session.headers.get('set-cookie')
      }
    })

    expect(product).toHaveProperty('_id')
    expect(product.name).toBe('Test Blender')
    expect(product.price).toBe(25000)
    expect(product.slug).toMatch(/test-blender/)
  })
})
```

### Testing Order Flow
```ts
describe('Order Flow', () => {
  it('initiates order with valid cart', async () => {
    const result = await $fetch('/api/orders/initiate', {
      method: 'POST',
      body: {
        email: 'test@example.com',
        name: 'Test Customer',
        address: '123 Test St',
        city: 'Accra',
        phone: '0244000000',
        items: [{
          id: '507f1f77bcf86cd799439011',  // Valid ObjectId
          name: 'Test Product',
          slug: 'test-product',
          price: 50000,  // Pesewas
          quantity: 2,
          images: [],
        }]
      }
    })

    expect(result).toHaveProperty('orderNumber')
    expect(result.orderNumber).toMatch(/^ls-[a-z0-9]{8}$/)
    expect(result).toHaveProperty('url')  // Paystack URL
    expect(result).toHaveProperty('reference')
  })

  it('rejects invalid discount code', async () => {
    await expect($fetch('/api/orders/initiate', {
      method: 'POST',
      body: {
        // ... valid items
        discountCode: 'INVALIDCODE'
      }
    })).rejects.toThrow()
  })
})
```

## Actor Testing

### Mocking RivetKit Client
```ts
// tests/integration/actors/catalog-actor.test.ts
import { describe, it, expect, vi } from 'vitest'

// Mock the Rivet client
vi.mock('~/server/rivet/client', () => ({
  useRivet: () => ({
    catalogActor: {
      getOrCreate: () => ({
        getProducts: vi.fn().mockResolvedValue([
          { _id: '1', name: 'Blender', slug: 'blender', price: 50000 }
        ]),
        getProduct: vi.fn().mockResolvedValue(
          { _id: '1', name: 'Blender', slug: 'blender', price: 50000 }
        ),
      })
    }
  })
}))

describe('catalogActor', () => {
  it('returns products from cache', async () => {
    const rivet = useRivet()
    const products = await rivet.catalogActor.getOrCreate(['main']).getProducts()

    expect(products).toHaveLength(1)
    expect(products[0].name).toBe('Blender')
  })
})
```

### Testing Inventory Actor Logic
```ts
describe('inventoryActor', () => {
  it('reserves stock atomically', async () => {
    const rivet = useRivet()
    const inventory = rivet.inventoryActor.getOrCreate(['main'])

    // Set initial stock
    await inventory.setStock('product-1', 10)

    // Reserve 3 units
    const remaining = await inventory.reserve('product-1', 3)
    expect(remaining).toBe(7)

    // Check stock
    const stock = await inventory.getStock('product-1')
    expect(stock).toBe(7)
  })

  it('throws on insufficient stock', async () => {
    const inventory = useRivet().inventoryActor.getOrCreate(['main'])
    await inventory.setStock('product-1', 5)

    await expect(inventory.reserve('product-1', 10))
      .rejects.toThrow('Insufficient stock')
  })

  it('releases stock correctly', async () => {
    const inventory = useRivet().inventoryActor.getOrCreate(['main'])
    await inventory.setStock('product-1', 10)

    await inventory.reserve('product-1', 3)
    const restored = await inventory.release('product-1', 3)

    expect(restored).toBe(10)
  })
})
```

## Component Testing

### Testing Vue Components
```ts
// tests/unit/components/ProductCard.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProductCard from '~/components/products/ProductCard.vue'

describe('ProductCard', () => {
  const mockProduct = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Premium Blender',
    slug: 'premium-blender',
    price: 50000,  // Pesewas
    images: ['/test-image.jpg'],
    status: 'active',
    category: 'blenders',
  }

  it('renders product information', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct }
    })

    expect(wrapper.text()).toContain('Premium Blender')
    expect(wrapper.text()).toContain('GHS 500.00')  // Formatted price
  })

  it('links to product detail page', () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct }
    })

    const link = wrapper.find('a')
    expect(link.attributes('href')).toBe('/products/premium-blender')
  })

  it('emits add-to-cart event', async () => {
    const wrapper = mount(ProductCard, {
      props: { product: mockProduct }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('addToCart')).toBeTruthy()
  })
})
```

### Testing Composables
```ts
// tests/unit/composables/useCart.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useCart } from '~/composables/useCart'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('useCart', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null)
  })

  it('starts with empty cart', () => {
    const { cart, cartCount, cartTotal } = useCart()

    expect(cart.value.items).toEqual([])
    expect(cartCount.value).toBe(0)
    expect(cartTotal.value).toBe(0)
  })

  it('adds item to cart', () => {
    const { addToCart, cart, cartCount } = useCart()

    const product = {
      _id: '1',
      name: 'Blender',
      slug: 'blender',
      price: 50000,
      images: ['/img.jpg'],
    }

    addToCart(product, 2)

    expect(cart.value.items).toHaveLength(1)
    expect(cart.value.items[0].quantity).toBe(2)
    expect(cartCount.value).toBe(2)
  })

  it('calculates total in pesewas', () => {
    const { addToCart, cartTotal } = useCart()

    addToCart({ _id: '1', name: 'A', slug: 'a', price: 10000, images: [] }, 2)
    addToCart({ _id: '2', name: 'B', slug: 'b', price: 20000, images: [] }, 1)

    expect(cartTotal.value).toBe(40000)  // 2*10000 + 1*20000
  })
})
```

## Schema Testing

### Testing Zod Schemas
```ts
// tests/unit/schemas/product.schema.test.ts
import { describe, it, expect } from 'vitest'
import { productSchema } from '~/schemas/product.schema'

describe('productSchema', () => {
  it('validates valid product', () => {
    const valid = {
      name: 'Test Product',
      price: 25.00,  // GHS input
      inventoryCount: 10,
      category: 'blenders',
    }

    const result = productSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects negative price', () => {
    const invalid = {
      name: 'Test',
      price: -10,
      inventoryCount: 5,
    }

    const result = productSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('rejects short name', () => {
    const invalid = {
      name: 'AB',  // Too short (min 3)
      price: 10,
      inventoryCount: 5,
    }

    const result = productSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('converts price to pesewas', () => {
    const input = {
      name: 'Test',
      price: 25.50,  // GHS
      inventoryCount: 10,
    }

    const result = productSchema.parse(input)
    expect(result.price).toBe(25.50)  // Schema validates input, conversion happens in handler
  })
})
```

## E2E Testing with Playwright

### Checkout Flow Test
```ts
// tests/e2e/checkout-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete checkout flow', async ({ page }) => {
  // 1. Visit product page
  await page.goto('/products/premium-blender')

  // 2. Add to cart
  await page.click('button:has-text("Add to Cart")')

  // 3. Go to cart
  await page.goto('/cart')
  await expect(page.locator('text=Premium Blender')).toBeVisible()

  // 4. Proceed to checkout
  await page.click('text=Checkout')

  // 5. Fill shipping details
  await page.fill('input[name="name"]', 'Test Customer')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="address"]', '123 Test Street')
  await page.fill('input[name="city"]', 'Accra')
  await page.fill('input[name="phone"]', '0244000000')

  // 6. Submit order
  await page.click('button:has-text("Pay")')

  // 7. Should redirect to Paystack (or show payment modal in test mode)
  await expect(page).toHaveURL(/paystack.com/)

  // 8. Complete test payment (Paystack test mode)
  // ... Paystack test payment flow

  // 9. Should return to success page
  await expect(page).toHaveURL(/\/orders\/success/)
})
```

### Admin Panel Test
```ts
test('admin login and product creation', async ({ page }) => {
  // 1. Login
  await page.goto('/admin/login')
  await page.fill('input[name="email"]', 'admin@lindis.store')
  await page.fill('input[name="password"]', 'password')
  await page.click('button:has-text("Login")')

  // 2. Should redirect to dashboard
  await expect(page).toHaveURL('/admin')

  // 3. Navigate to products
  await page.click('text=Products')

  // 4. Create new product
  await page.click('text=Add Product')
  await page.fill('input[name="name"]', 'E2E Test Product')
  await page.fill('input[name="price"]', '150')
  await page.fill('input[name="inventoryCount"]', '20')
  await page.selectOption('select[name="category"]', 'blenders')
  await page.click('button:has-text("Create")')

  // 5. Should show success and redirect
  await expect(page.locator('text=Product created')).toBeVisible()
})
```

## Test Data Factories

```ts
// tests/factories/product.ts
import { ObjectId } from 'mongodb'

export const createProductFactory = (overrides = {}) => ({
  _id: new ObjectId(),
  name: 'Test Product',
  slug: `test-product-${Date.now()}`,
  description: 'A test product',
  price: 50000,  // Pesewas = GHS 500
  currency: 'GHS',
  inventoryCount: 100,
  images: ['/test.jpg'],
  status: 'active',
  isFeatured: false,
  category: 'blenders',
  type: 'standard',
  specs: {},
  reviewStats: { averageRating: 0, totalCount: 0 },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
})

export const createOrderFactory = (overrides = {}) => ({
  _id: new ObjectId(),
  orderNumber: `ls-${Math.random().toString(36).substring(2, 10)}`,
  guestEmail: 'test@example.com',
  status: 'pending',
  paymentStatus: 'unpaid',
  subtotal: 50000,
  discountAmount: 0,
  total: 50000,
  discount: null,
  items: [{
    productId: new ObjectId(),
    productName: 'Test Product',
    productSlug: 'test-product',
    productImages: ['/test.jpg'],
    quantity: 1,
    priceAtPurchase: 50000,
  }],
  payment: {
    reference: 'pay-test-123',
    provider: 'paystack',
    amount: 50000,
    status: 'pending',
  },
  shippingDetails: {
    name: 'Test Customer',
    phone: '0244000000',
    address: '123 Test St',
    city: 'Accra',
  },
  createdAt: new Date(),
  ...overrides,
})
```

## Mocking External Services

### Mock Paystack
```ts
// tests/mocks/paystack.ts
import { vi } from 'vitest'

vi.mock('~/server/utils/paystack', () => ({
  usePaystack: () => ({
    initializeTransaction: vi.fn().mockResolvedValue({
      authorization_url: 'https://checkout.paystack.com/test-token',
      reference: 'pay-test-ref',
      access_code: 'test-access-code',
    }),
    verifyTransaction: vi.fn().mockResolvedValue({
      status: 'success',
      amount: 50000,
      reference: 'pay-test-ref',
    }),
  }),
}))
```

### Mock Maileroo
```ts
vi.mock('~/server/utils/email', () => ({
  sendTemplatedEmail: vi.fn().mockResolvedValue(undefined),
}))
```

## Do NOT

- Test implementation details (test behavior, not internals)
- Forget to clean up test data in MongoDB
- Write tests that depend on external services (always mock)
- Skip testing error cases (they're often where bugs hide)
- Write tests with hardcoded IDs that might conflict
- Forget to reset mocks between tests
- Test private functions directly
- Write tests that pass/fail based on timing

## Reference Files

- Vitest config: `vitest.config.ts` (if exists) or use Nuxt test utils
- Nuxt testing: https://nuxt.com/docs/getting-started/testing
- Vue Test Utils: https://test-utils.vuejs.org/
- Playwright: https://playwright.dev/