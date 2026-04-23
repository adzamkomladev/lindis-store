import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'
import { updateOrderSchema } from '~~/schemas/order.schema'
import { enqueueReviewRequest } from '~/server/utils/queues'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Order ID is required' })

  const body = await readValidatedBody(event, updateOrderSchema.parse)
  const { orders } = collections()

  let filter: any
  if (ObjectId.isValid(id)) {
    filter = { $or: [{ _id: new ObjectId(id) }, { orderNumber: id }] }
  } else {
    filter = { orderNumber: id }
  }

  const existingOrder = await orders.findOne(filter)
  if (!existingOrder) throw createError({ statusCode: 404, message: 'Order not found' })

  await orders.updateOne(filter, { $set: body })

  // Trigger review request when order becomes delivered (via Rivet reviewWorker)
  if (body.status === 'delivered' && existingOrder.status !== 'delivered') {
    await enqueueReviewRequest({
      orderId: existingOrder._id!.toString(),
      orderNumber: existingOrder.orderNumber,
      email: existingOrder.guestEmail,
      customerName: existingOrder.shippingDetails?.name || existingOrder.guestEmail,
      items: existingOrder.items.map(item => ({
        productId: item.productId.toString(),
        productName: item.productName,
        productImages: item.productImages,
      })),
    })
    console.log(`[Admin Orders] Review request queued for order ${existingOrder.orderNumber}`)
  }

  return { ...existingOrder, ...body }
})
