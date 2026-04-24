import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { revenueQuerySchema } from '~~/schemas/stats.schema'
import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = await getValidatedQuery(event, revenueQuerySchema.parse)
  const period = query.period ?? 'month'

  try {
    const rivet = useRivet()
    const chartData = await rivet.analyticsActor.getOrCreate(['main']).getRevenueChart(period as 'month')

    // If we have cached data, return it
    if (chartData && chartData.labels.length > 0) {
      const totalRevenue = chartData.revenue.reduce((a: number, b: number) => a + b, 0)
      const totalOrders = chartData.orders.reduce((a: number, b: number) => a + b, 0)
      const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0
      return {
        labels: chartData.labels,
        revenue: chartData.revenue,
        orders: chartData.orders,
        totalRevenue,
        totalOrders,
        avgOrder,
      }
    }

    // Fallback: trigger refresh and return from MongoDB
    await rivet.analyticsActor.getOrCreate(['main']).refresh()
    const refreshed = await rivet.analyticsActor.getOrCreate(['main']).getRevenueChart(period as 'month')

    const totalRevenue = (refreshed?.revenue ?? []).reduce((a: number, b: number) => a + b, 0)
    const totalOrders = (refreshed?.orders ?? []).reduce((a: number, b: number) => a + b, 0)
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    return {
      labels: refreshed?.labels ?? [],
      revenue: refreshed?.revenue ?? [],
      orders: refreshed?.orders ?? [],
      totalRevenue,
      totalOrders,
      avgOrder,
    }
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to MongoDB for revenue chart')
    await connectDB()
    const { orders } = collections()

    const now = new Date()
    const days = period === 'month' ? 30 : 7
    const startDate = new Date(now)
    startDate.setDate(startDate.getDate() - days)

    const dailyRevenue = await orders.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray()

    const labels = dailyRevenue.map(d => d._id)
    const revenue = dailyRevenue.map(d => d.revenue)
    const ordersCount = dailyRevenue.map(d => d.orders)
    const totalRevenue = revenue.reduce((a, b) => a + b, 0)
    const totalOrders = ordersCount.reduce((a, b) => a + b, 0)
    const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0

    return {
      labels,
      revenue,
      orders: ordersCount,
      totalRevenue,
      totalOrders,
      avgOrder,
    }
  }
})
