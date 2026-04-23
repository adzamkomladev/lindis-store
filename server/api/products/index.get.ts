import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import { isRivetRunnerUnavailable, useRivet } from '~/server/rivet/client'

export default cachedEventHandler(async (_event) => {
  try {
    const rivet = useRivet()
    return await rivet.catalogActor.getOrCreate(['main']).getProducts()
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to MongoDB for product list:', (error as Error).message)
    await connectDB()
    const { products } = collections()
    return await products
      .find({ status: 'active' })
      .sort({ createdAt: -1 })
      .toArray()
  }
}, {
  maxAge: 60 * 60, // 1 hour cache
  name: 'all-products',
})
