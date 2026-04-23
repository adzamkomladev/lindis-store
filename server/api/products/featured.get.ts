import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import { isRivetRunnerUnavailable, useRivet } from '~/server/rivet/client'

export default cachedEventHandler(async (_event) => {
  try {
    const rivet = useRivet()
    const featured = await rivet.catalogActor.getOrCreate(['main']).getFeatured()
    return featured.slice(0, 8)
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to MongoDB for featured products:', (error as Error).message)
    await connectDB()
    const { products } = collections()
    return await products
      .find({ status: 'active', isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray()
  }
}, {
  maxAge: 60 * 60,
  name: 'featured-products',
})