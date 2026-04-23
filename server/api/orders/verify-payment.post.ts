import { z } from 'zod'
import { collections } from '~/server/utils/db'
import { enqueueVerifyPayment } from '~/server/utils/queues'

const schema = z.object({
  orderNumber: z.string(),
  paymentReference: z.string(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)

  const { orders } = collections()

  const order = await orders.findOne({ orderNumber: body.orderNumber })
  if (!order) throw createError({ statusCode: 404, message: 'Order not found' })

  const payment = order.payment
  if (!payment) throw createError({ statusCode: 404, message: 'Payment not found' })

  if (payment.status === 'success') {
    return { success: true, message: 'Payment already verified', status: 'success' }
  }
  if (payment.status === 'failed') {
    return { success: false, message: 'Payment has already failed', status: 'failed' }
  }

  // Enqueue to paymentWorker for verification
  await enqueueVerifyPayment({
    reference: body.paymentReference,
    orderNumber: body.orderNumber,
  })

  return { success: true, message: 'Payment verification queued', status: 'pending' }
})
