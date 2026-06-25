import { z } from 'zod'
import { collections } from '~/server/utils/db'
import { usePaystack } from '~/server/utils/paystack'
import { enqueueEmail } from '~/server/utils/queues'

const schema = z.object({
  orderNumber: z.string(),
  paymentReference: z.string(),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, schema.parse)
  const { orders, discountCodes } = collections()

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

  // Verify directly with Paystack
  const { verifyTransaction } = usePaystack()
  const result = await verifyTransaction(body.paymentReference)

  if (result.status === 'success') {
    await orders.updateOne(
      { orderNumber: body.orderNumber },
      {
        $set: {
          paymentStatus: 'paid',
          status: 'processing',
          'payment.status': 'success',
          'payment.amount': result.amount,
          'payment.metadata': result.metadata ?? {},
          'payment.processedAt': new Date(),
        },
      }
    )

    if (order.discount?.code) {
      await discountCodes.updateOne(
        { code: order.discount.code },
        { $inc: { usedCount: 1 } }
      )
    }

    await enqueueEmail({
      to: order.guestEmail,
      subject: `Order Confirmed - ${body.orderNumber}`,
      templateId: 'order_confirmation',
      data: {
        orderNumber: body.orderNumber,
        items: order.items,
        total: order.total,
        shippingDetails: order.shippingDetails,
      },
    })

    return { success: true, message: 'Payment verified successfully', status: 'success' }
  }

  await orders.updateOne(
    { orderNumber: body.orderNumber },
    { $set: { paymentStatus: 'failed', 'payment.status': 'failed' } }
  )

  return { success: false, message: 'Payment verification failed', status: 'failed' }
})
