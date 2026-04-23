import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { orders } = collections()

  const recentOrders = await orders
    .find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .project({
      orderNumber: 1,
      guestEmail: 1,
      status: 1,
      paymentStatus: 1,
      total: 1,
      shippingDetails: 1,
      createdAt: 1,
    })
    .toArray()

  return recentOrders.map(order => ({
    ...order,
    customerName: order.shippingDetails?.name || order.guestEmail || 'Guest',
  }))
})
