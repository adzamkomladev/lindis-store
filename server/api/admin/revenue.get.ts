import { useRivet } from '~/server/rivet/client'
import { revenueQuerySchema } from '~~/schemas/stats.schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const { period } = await getValidatedQuery(event, revenueQuerySchema.parse)

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
})
