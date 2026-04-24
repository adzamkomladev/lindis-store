import { actor, event, UserError } from 'rivetkit'

export const inventoryActor = actor({
  options: { name: 'Inventory Manager', icon: '📦' },
  state: {
    stock: {} as Record<string, number>, // productId → available count
  },
  events: {
    stockChanged: event<{ productId: string; count: number }>(),
    lowStock: event<{ productId: string; count: number; threshold: number }>(),
  },
  onCreate: async (c) => {
    try {
      // Load stock counts from MongoDB products
      const { collections } = await import('~/server/db/collections')
      const { products } = collections()
      const all = await products.find({ status: 'active' }).project({ _id: 1, inventoryCount: 1 }).toArray()
      for (const p of all) {
        c.state.stock[p._id!.toString()] = p.inventoryCount
      }
      console.log(`[InventoryActor] Loaded stock for ${all.length} products`)
    } catch (err) {
      console.error('[InventoryActor] Failed to load stock from DB on create:', err)
      // Actor survives with empty stock; will be populated on first reserve/setStock
    }
  },
  actions: {
    /**
     * Atomically reserve stock. Throws UserError if insufficient.
     * Called by cartActor before adding to cart, and by orderActor on checkout.
     */
    reserve: (c, productId: string, qty: number): number => {
      const current = c.state.stock[productId] ?? 0
      if (current < qty) {
        throw new UserError('Insufficient stock', {
          code: 'out_of_stock',
          metadata: { productId, requested: qty, available: current },
        })
      }
      c.state.stock[productId] = current - qty
      c.broadcast('stockChanged', { productId, count: c.state.stock[productId] })

      const LOW_STOCK_THRESHOLD = 5
      if (c.state.stock[productId] <= LOW_STOCK_THRESHOLD) {
        c.broadcast('lowStock', {
          productId,
          count: c.state.stock[productId],
          threshold: LOW_STOCK_THRESHOLD,
        })
      }
      return c.state.stock[productId]
    },

    /**
     * Release previously reserved stock (e.g. cart abandoned, order cancelled).
     */
    release: (c, productId: string, qty: number): number => {
      c.state.stock[productId] = (c.state.stock[productId] ?? 0) + qty
      c.broadcast('stockChanged', { productId, count: c.state.stock[productId] })
      return c.state.stock[productId]
    },

    getStock: (c, productId: string): number => c.state.stock[productId] ?? 0,

    getAllStock: (c): Record<string, number> => c.state.stock,

    /**
     * Set stock count directly (admin override or sync from MongoDB).
     */
    setStock: (c, productId: string, count: number): void => {
      c.state.stock[productId] = Math.max(0, count)
      c.broadcast('stockChanged', { productId, count: c.state.stock[productId] })
    },

    /**
     * Bulk sync from MongoDB — called after DB update.
     */
    bulkSync: (c, stockMap: Record<string, number>): void => {
      c.state.stock = { ...c.state.stock, ...stockMap }
    },
  },
})
