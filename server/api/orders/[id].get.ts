import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Order ID is required' })

  const { orders } = collections()

  // Accept either MongoDB ObjectId or orderNumber
  let filter: any
  if (ObjectId.isValid(id)) {
    filter = { $or: [{ _id: new ObjectId(id) }, { orderNumber: id }] }
  } else {
    filter = { orderNumber: id }
  }

  const order = await orders.findOne(filter)
  if (!order) throw createError({ statusCode: 404, message: 'Order not found' })

  // All data embedded — items (with reviews), payment, discount — single document
  return order
})
