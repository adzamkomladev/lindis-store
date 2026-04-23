import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { orders } = collections()

  // Payments are now embedded in orders — project the payment field
  const ordersWithPayments = await orders
    .find({ 'payment.status': { $exists: true } })
    .sort({ createdAt: -1 })
    .project({
      _id: 1,
      orderNumber: 1,
      guestEmail: 1,
      'payment.reference': 1,
      'payment.provider': 1,
      'payment.amount': 1,
      'payment.status': 1,
      'payment.processedAt': 1,
      createdAt: 1,
    })
    .toArray()

  return ordersWithPayments.map(o => ({
    orderId: o._id,
    orderNumber: o.orderNumber,
    guestEmail: o.guestEmail,
    ...o.payment,
    createdAt: o.createdAt,
  }))
})
