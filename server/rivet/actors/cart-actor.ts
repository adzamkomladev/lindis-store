import { actor, event, UserError } from 'rivetkit'
import type { ProductDoc } from '~/server/db/types'

export interface CartItem {
  productId: string
  productName: string
  productSlug: string
  productImages: string[]
  price: number       // pesewas
  quantity: number
  customText?: string
}

export interface AppliedDiscount {
  code: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  discountAmount: number
}

function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

function calcTotal(items: CartItem[], discount: AppliedDiscount | null): number {
  const subtotal = calcSubtotal(items)
  if (!discount) return subtotal
  if (discount.type === 'percentage') return Math.round(subtotal * (1 - discount.value / 100))
  if (discount.type === 'fixed') return Math.max(0, subtotal - discount.value)
  return subtotal // free_shipping — no price change
}

export const cartActor = actor({
  options: { name: 'Shopping Cart', icon: '🛒' },
  state: {
    items: [] as CartItem[],
    discountCode: null as AppliedDiscount | null,
  },
  events: {
    cartUpdated: event<{ items: CartItem[]; subtotal: number; total: number }>(),
  },
  actions: {
    addItem: async (c, product: Pick<ProductDoc, '_id' | 'name' | 'slug' | 'images' | 'price'>, qty: number) => {
      // Validate stock via inventoryActor actor-to-actor call
      const client = c.client<typeof import('../registry').registry>()
      const productId = product._id!.toString()
      const stock = await client.inventoryActor.getOrCreate(['main']).getStock(productId)

      const existingQty = c.state.items.find(i => i.productId === productId)?.quantity ?? 0
      if (stock < existingQty + qty) {
        throw new UserError('Not enough stock available', {
          code: 'insufficient_stock',
          metadata: { available: stock, requested: existingQty + qty },
        })
      }

      const existingIdx = c.state.items.findIndex(i => i.productId === productId)
      if (existingIdx >= 0) {
        c.state.items[existingIdx].quantity += qty
      } else {
        c.state.items.push({
          productId,
          productName: product.name,
          productSlug: product.slug,
          productImages: product.images,
          price: product.price,
          quantity: qty,
        })
      }

      const subtotal = calcSubtotal(c.state.items)
      const total = calcTotal(c.state.items, c.state.discountCode)
      c.broadcast('cartUpdated', { items: c.state.items, subtotal, total })
    },

    removeItem: (c, productId: string) => {
      c.state.items = c.state.items.filter(i => i.productId !== productId)
      const subtotal = calcSubtotal(c.state.items)
      const total = calcTotal(c.state.items, c.state.discountCode)
      c.broadcast('cartUpdated', { items: c.state.items, subtotal, total })
    },

    updateQuantity: async (c, productId: string, qty: number) => {
      if (qty <= 0) {
        c.state.items = c.state.items.filter(i => i.productId !== productId)
      } else {
        const client = c.client<typeof import('../registry').registry>()
        const stock = await client.inventoryActor.getOrCreate(['main']).getStock(productId)
        if (stock < qty) {
          throw new UserError('Not enough stock', { code: 'insufficient_stock' })
        }
        const idx = c.state.items.findIndex(i => i.productId === productId)
        if (idx >= 0) c.state.items[idx].quantity = qty
      }
      const subtotal = calcSubtotal(c.state.items)
      const total = calcTotal(c.state.items, c.state.discountCode)
      c.broadcast('cartUpdated', { items: c.state.items, subtotal, total })
    },

    applyDiscount: async (c, code: string) => {
      const { collections } = await import('~/server/db/collections')
      const { discountCodes } = collections()

      const now = new Date()
      const discount = await discountCodes.findOne({
        code: code.toUpperCase(),
        isActive: true,
        $and: [
          { $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] },
          { $or: [{ startsAt: { $exists: false } }, { startsAt: { $lte: now } }] },
        ],
      })

      if (!discount) throw new UserError('Invalid or expired discount code', { code: 'invalid_discount' })
      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        throw new UserError('Discount code has reached its usage limit', { code: 'discount_exhausted' })
      }

      const subtotal = calcSubtotal(c.state.items)
      let discountAmount = 0
      if (discount.type === 'percentage') discountAmount = Math.round(subtotal * discount.value / 100)
      if (discount.type === 'fixed') discountAmount = Math.min(discount.value, subtotal)

      c.state.discountCode = {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        discountAmount,
      }

      return c.state.discountCode
    },

    removeDiscount: (c) => {
      c.state.discountCode = null
    },

    getCart: (c) => ({
      items: c.state.items,
      discount: c.state.discountCode,
      subtotal: calcSubtotal(c.state.items),
      total: calcTotal(c.state.items, c.state.discountCode),
      itemCount: c.state.items.reduce((sum, i) => sum + i.quantity, 0),
    }),

    clear: (c) => {
      c.state.items = []
      c.state.discountCode = null
    },
  },
})
