import { reviewValidateSchema } from '~~/schemas/review.schema'
import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, reviewValidateSchema.parse)

  const { reviewTokens } = collections()

  const reviewToken = await reviewTokens.findOne({ token: query.token })

  if (!reviewToken) throw createError({ statusCode: 404, message: 'Review link is invalid.' })

  if (reviewToken.usedAt) return { valid: false, reason: 'used' }
  if (new Date() > reviewToken.expiresAt) return { valid: false, reason: 'expired' }

  // Return the denormalized items snapshot stored in the token (no join needed)
  return {
    valid: true,
    orderId: reviewToken.orderId.toString(),
    orderNumber: reviewToken.orderNumber,
    email: reviewToken.email,
    items: reviewToken.items, // DENORMALIZED in token — no products join needed
  }
})
