import { actor } from 'rivetkit'

interface DashboardStats {
  totalRevenue: number
  totalOrders: number
  activeProducts: number
  pendingOrders: number
}

interface ChartDataset {
  labels: string[]
  revenue: number[]
  orders: number[]
}

async function fetchStats(): Promise<{ dashboard: DashboardStats; chart: Record<string, ChartDataset> }> {
  const { collections } = await import('~/server/db/collections')
  const { orders, products } = collections()

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Dashboard stats aggregation
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

  const totalRevenue = revenueResult[0]?.total ?? 0
  const totalOrders = orderCounts.reduce((sum, o) => sum + o.count, 0)
  const pendingOrders = orderCounts.find(o => o._id === 'pending')?.count ?? 0

  // Get last 30 days for revenue chart
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const dailyRevenue = await orders.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]).toArray()

  const chartMonth: ChartDataset = {
    labels: dailyRevenue.map(d => d._id),
    revenue: dailyRevenue.map(d => d.revenue),
    orders: dailyRevenue.map(d => d.orders),
  }

  return {
    dashboard: { totalRevenue, totalOrders, activeProducts: productCount, pendingOrders },
    chart: { month: chartMonth },
  }
}

export const analyticsActor = actor({
  options: { name: 'Analytics Engine', icon: '📊' },
  state: {
    dashboard: {
      totalRevenue: 0,
      totalOrders: 0,
      activeProducts: 0,
      pendingOrders: 0,
    } as DashboardStats,
    chart: {} as Record<string, { labels: string[]; revenue: number[]; orders: number[] }>,
    lastRefreshed: 0,
  },
  onCreate: async (c) => {
    const stats = await fetchStats()
    c.state.dashboard = stats.dashboard
    c.state.chart = stats.chart
    c.state.lastRefreshed = Date.now()

    // Schedule hourly refresh
    c.schedule.after(60 * 60 * 1000, 'scheduledRefresh')
    console.log('[AnalyticsActor] Initialized with stats')
  },
  actions: {
    getDashboardStats: (c) => c.state.dashboard,
    getRevenueChart: (c, period: 'month' = 'month') => c.state.chart[period] ?? { labels: [], revenue: [], orders: [] },
    getLastRefreshed: (c) => c.state.lastRefreshed,

    // Called by scheduler every hour
    scheduledRefresh: async (c) => {
      const stats = await fetchStats()
      c.state.dashboard = stats.dashboard
      c.state.chart = stats.chart
      c.state.lastRefreshed = Date.now()
      // Reschedule next refresh
      c.schedule.after(60 * 60 * 1000, 'scheduledRefresh')
    },

    // Manual refresh (admin action)
    refresh: async (c) => {
      const stats = await fetchStats()
      c.state.dashboard = stats.dashboard
      c.state.chart = stats.chart
      c.state.lastRefreshed = Date.now()
    },
  },
})
