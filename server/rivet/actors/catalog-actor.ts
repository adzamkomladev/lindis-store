import { actor, event, UserError } from 'rivetkit'
import type { ObjectId } from 'mongodb'
import type { ProductDoc, CreateProductInput, UpdateProductInput } from '~/server/db/types'
import { collections } from '~/server/db/collections'

type ProductFilters = {
  category?: string
  status?: 'draft' | 'active' | 'archived'
  featured?: boolean
}

interface CatalogState {
  products: ProductDoc[]
  bySlug: Record<string, ProductDoc>
  featured: ProductDoc[]
  byCategory: Record<string, ProductDoc[]>
  lastSynced: number
}

async function buildIndexFromDB(state: CatalogState): Promise<void> {
  const { products: col } = collections()
  const allProducts = await col.find({ status: { $in: ['draft', 'active', 'archived'] } })
    .sort({ createdAt: -1 })
    .toArray()

  state.products = allProducts
  state.bySlug = {}
  state.featured = []
  state.byCategory = {}

  for (const p of allProducts) {
    state.bySlug[p.slug] = p
    if (p.isFeatured && p.status === 'active') {
      state.featured.push(p)
    }
    if (!state.byCategory[p.category]) {
      state.byCategory[p.category] = []
    }
    state.byCategory[p.category].push(p)
  }
  state.lastSynced = Date.now()
}

export const catalogActor = actor({
  options: { name: 'Product Catalog', icon: '🏪' },
  state: {
    products: [] as ProductDoc[],
    bySlug: {} as Record<string, ProductDoc>,
    featured: [] as ProductDoc[],
    byCategory: {} as Record<string, ProductDoc[]>,
    lastSynced: 0,
  } as CatalogState,
  events: {
    productUpdated: event<{ slug: string; product: ProductDoc | null }>(),
    catalogRefreshed: event<void>(),
  },
  onCreate: async (c) => {
    try {
      await buildIndexFromDB(c.state)
      console.log(`[CatalogActor] Loaded ${c.state.products.length} products into memory`)
    } catch (err) {
      console.error('[CatalogActor] Failed to load from DB on create:', err)
      // Actor survives with empty state; can be refreshed later via admin action
    }
  },
  actions: {
    // ── READ actions (in-memory, sub-ms) ──────────────────────────────────
    getProducts: (c, filters?: ProductFilters) => {
      let results = c.state.products
      if (filters?.status) {
        results = results.filter(p => p.status === filters.status)
      } else {
        results = results.filter(p => p.status === 'active')
      }
      if (filters?.category && filters.category !== 'all') {
        results = results.filter(p => p.category === filters.category)
      }
      if (filters?.featured) {
        results = results.filter(p => p.isFeatured)
      }
      return results
    },

    getProduct: (c, slug: string) => c.state.bySlug[slug] ?? null,

    getFeatured: (c) => c.state.featured,

    getByCategory: (c, category: string) => c.state.byCategory[category] ?? [],

    getCategories: (c) => Object.keys(c.state.byCategory),

    searchProducts: (c, query: string) => {
      const q = query.toLowerCase().trim()
      if (!q) return []
      return c.state.products.filter(p => {
        if (p.status !== 'active') return false
        return (
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q)
        )
      }).slice(0, 20)
    },

    // ── WRITE actions (mutate state + persist to MongoDB) ─────────────────
    createProduct: async (c, data: CreateProductInput): Promise<ProductDoc> => {
      const { products: col } = collections()

      // Check slug uniqueness in state first (fast)
      if (c.state.bySlug[data.slug]) {
        throw new UserError('Product with this slug already exists', { code: 'slug_taken' })
      }

      const now = new Date()
      const product: ProductDoc = {
        ...data,
        reviewStats: { averageRating: 0, totalCount: 0 },
        createdAt: now,
        updatedAt: now,
      }

      const result = await col.insertOne(product as any)
      const inserted = { ...product, _id: result.insertedId }

      // Update in-memory indexes
      c.state.products.unshift(inserted)
      c.state.bySlug[inserted.slug] = inserted
      if (inserted.isFeatured && inserted.status === 'active') {
        c.state.featured.unshift(inserted)
      }
      if (!c.state.byCategory[inserted.category]) {
        c.state.byCategory[inserted.category] = []
      }
      c.state.byCategory[inserted.category].unshift(inserted)

      c.broadcast('productUpdated', { slug: inserted.slug, product: inserted })
      return inserted
    },

    updateProduct: async (c, id: string, data: UpdateProductInput): Promise<ProductDoc> => {
      const { products: col } = collections()
      const { ObjectId } = await import('mongodb')

      const objectId = new ObjectId(id)
      const existing = c.state.products.find(p => p._id?.toString() === id)
      if (!existing) throw new UserError('Product not found', { code: 'not_found' })

      const now = new Date()
      const updated = { ...existing, ...data, updatedAt: now }

      await col.updateOne({ _id: objectId }, { $set: { ...data, updatedAt: now } })

      // Rebuild in-memory indexes
      const idx = c.state.products.findIndex(p => p._id?.toString() === id)
      if (idx !== -1) c.state.products[idx] = updated
      c.state.bySlug[updated.slug] = updated

      // Rebuild featured + byCategory
      c.state.featured = c.state.products.filter(p => p.isFeatured && p.status === 'active')
      c.state.byCategory = {}
      for (const p of c.state.products) {
        if (!c.state.byCategory[p.category]) c.state.byCategory[p.category] = []
        c.state.byCategory[p.category].push(p)
      }

      c.broadcast('productUpdated', { slug: updated.slug, product: updated })
      return updated
    },

    deleteProduct: async (c, id: string): Promise<void> => {
      const { products: col } = collections()
      const { ObjectId } = await import('mongodb')

      const existing = c.state.products.find(p => p._id?.toString() === id)
      if (!existing) throw new UserError('Product not found', { code: 'not_found' })

      await col.deleteOne({ _id: new ObjectId(id) })

      // Remove from in-memory state
      c.state.products = c.state.products.filter(p => p._id?.toString() !== id)
      delete c.state.bySlug[existing.slug]
      c.state.featured = c.state.featured.filter(p => p._id?.toString() !== id)
      if (c.state.byCategory[existing.category]) {
        c.state.byCategory[existing.category] = c.state.byCategory[existing.category].filter(
          p => p._id?.toString() !== id
        )
      }

      c.broadcast('productUpdated', { slug: existing.slug, product: null })
    },

    // Called by reviewWorker — Computed Pattern
    updateReviewStats: (c, productId: string, stats: { averageRating: number; totalCount: number }) => {
      const idx = c.state.products.findIndex(p => p._id?.toString() === productId)
      if (idx === -1) return

      c.state.products[idx] = { ...c.state.products[idx], reviewStats: stats }
      const slug = c.state.products[idx].slug
      if (c.state.bySlug[slug]) {
        c.state.bySlug[slug] = c.state.products[idx]
      }
    },

    // Full rebuild from MongoDB (admin action or recovery)
    refresh: async (c) => {
      await buildIndexFromDB(c.state)
      c.broadcast('catalogRefreshed', undefined)
      console.log(`[CatalogActor] Refreshed — ${c.state.products.length} products loaded`)
    },
  },
})
