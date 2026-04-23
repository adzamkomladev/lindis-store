import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Order ID is required' })

  const { orders } = collections()

  // Single query — items, payment, and discount all embedded in the order document
  let filter: any
  if (ObjectId.isValid(id)) {
    filter = { $or: [{ _id: new ObjectId(id) }, { orderNumber: id }] }
  } else {
    filter = { orderNumber: id }
  }

  const order = await orders.findOne(filter)
  if (!order) throw createError({ statusCode: 404, message: 'Order not found' })

  // No joins needed — items, payment, and discount are all embedded
  return order
})
