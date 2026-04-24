import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  try {
    const rivet = useRivet()
    return await rivet.analyticsActor.getOrCreate(['main']).getDashboardStats()
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to MongoDB for admin stats')
    await connectDB()
    const { orders, products } = collections()

    const [revenueResult, orderCounts, productCount] = await Promise.all([
      orders.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]).toArray(),
      orders.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]).toArray(),
      products.countDocuments({ status: 'active' }),
    ])

    return {
      totalRevenue: revenueResult[0]?.total ?? 0,
      totalOrders: orderCounts.reduce((sum, o) => sum + o.count, 0),
      activeProducts: productCount,
      pendingOrders: orderCounts.find(o => o._id === 'pending')?.count ?? 0,
    }
  }
})
