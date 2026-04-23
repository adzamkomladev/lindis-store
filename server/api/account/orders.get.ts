import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user || user.role !== 'customer') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { orders } = collections()
  const userId = new ObjectId(user.id)

  // Fetch orders by userId OR guestEmail (for legacy guest orders with same email)
  const userOrders = await orders
    .find({
      $or: [
        { userId },
        { guestEmail: user.email },
      ],
    })
    .sort({ createdAt: -1 })
    .toArray()

  return userOrders.map(order => ({
    id: order._id!.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    items: order.items,
    createdAt: order.createdAt,
    shippingDetails: order.shippingDetails,
  }))
})
