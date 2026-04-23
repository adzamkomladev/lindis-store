import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import { isRivetRunnerUnavailable, useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = (query.q as string || '').trim()

  if (!searchQuery) {
    return { products: [], total: 0 }
  }

  try {
    const rivet = useRivet()
    const products = await rivet.catalogActor.getOrCreate(['main']).searchProducts(searchQuery)
    return { products: products.slice(0, 20), total: products.length }
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to MongoDB for search:', (error as Error).message)
    await connectDB()
    const { products } = collections()

    const results = await products
      .find(
        {
          status: 'active',
          $text: { $search: searchQuery },
        },
        {
          projection: {
            _id: 1,
            name: 1,
            slug: 1,
            description: 1,
            price: 1,
            images: 1,
            category: 1,
            reviewStats: 1,
            score: { $meta: 'textScore' },
          },
          sort: { score: { $meta: 'textScore' } },
          limit: 20,
        }
      )
      .toArray()

    return { products: results, total: results.length }
  }
})
