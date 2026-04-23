import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import { isRivetRunnerUnavailable, useRivet } from '~/server/rivet/client'

export default cachedEventHandler(async () => {
  try {
    const rivet = useRivet()
    const stats = await rivet.analyticsActor.getOrCreate(['main']).getDashboardStats()
    return {
      totalOrders: stats.totalOrders,
      totalProducts: stats.activeProducts,
    }
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to MongoDB for public stats:', (error as Error).message)
    await connectDB()
    const { orders, products } = collections()
    const [totalOrders, totalProducts] = await Promise.all([
      orders.countDocuments(),
      products.countDocuments({ status: 'active' }),
    ])

    return { totalOrders, totalProducts }
  }
}, {
  maxAge: 60 * 5, // 5 minutes
  name: 'public-stats',
})
