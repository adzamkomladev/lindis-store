import { reviewSubmitSchema } from '~~/schemas/review.schema'
import { collections } from '~/server/utils/db'
import { enqueueReviewSubmission } from '~/server/utils/queues'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, reviewSubmitSchema.parse)

  const { reviewTokens, orders } = collections()

  // 1. Validate token
  const reviewToken = await reviewTokens.findOne({ token: body.token })
  if (!reviewToken) throw createError({ statusCode: 404, message: 'Review link is invalid.' })
  if (reviewToken.usedAt) throw createError({ statusCode: 400, message: 'This review link has already been used.' })
  if (new Date() > reviewToken.expiresAt) throw createError({ statusCode: 400, message: 'This review link has expired.' })

  // 2. Get order for customer name
  const order = await orders.findOne({ _id: reviewToken.orderId })
  if (!order) throw createError({ statusCode: 404, message: 'Order not found.' })

  const customerName = order.shippingDetails?.name || reviewToken.email

  // 3. Enqueue each review to reviewWorker — handles all 5 writes (review + stats + embed + token)
  for (const r of body.reviews) {
    await enqueueReviewSubmission({
      token: body.token,
      productId: r.productId,
      orderId: reviewToken.orderId.toString(),
      orderNumber: reviewToken.orderNumber,
      customerEmail: reviewToken.email,
      customerName,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
    })
  }

  return { success: true, message: "Thank you for your review!" }
})
