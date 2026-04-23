import { actor, queue } from 'rivetkit'
import { nanoid } from 'nanoid'
import type { ObjectId } from 'mongodb'

export interface ReviewRequestPayload {
  orderId: string
  orderNumber: string
  email: string
  customerName: string
  items: {
    productId: string
    productName: string
    productImages: string[]
  }[]
}

export interface ReviewSubmissionPayload {
  token: string
  productId: string
  orderId: string
  orderNumber: string
  customerEmail: string
  customerName: string
  rating: number
  title?: string
  comment?: string
}

export const reviewWorker = actor({
  options: { name: 'Review Processor', icon: '⭐' },
  state: { tokensCreated: 0, reviewsProcessed: 0 },
  queues: {
    reviewRequests: queue<ReviewRequestPayload>(),
    reviewSubmissions: queue<ReviewSubmissionPayload>(),
  },
  run: async (c) => {
    for await (const message of c.queue.iter()) {
      if (message.name === 'reviewRequests') {
        const { orderId, orderNumber, email, customerName, items } = message.body

        const { collections } = await import('~/server/db/collections')
        const { ObjectId } = await import('mongodb')
        const { reviewTokens } = collections()

        const token = nanoid(32)
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

        await reviewTokens.insertOne({
          orderId: new ObjectId(orderId),
          orderNumber,
          token,
          email,
          items: items.map(i => ({
            productId: new ObjectId(i.productId),
            productName: i.productName,
            productImages: i.productImages,
          })),
          expiresAt,
          createdAt: new Date(),
        })

        // Enqueue invitation email
        const client = c.client<typeof import('../registry').registry>()
        await client.emailWorker.getOrCreate(['main']).emails.push({
          to: email,
          subject: `How was your Lindi's Store order?`,
          templateId: 'review_invitation',
          data: {
            customerName,
            orderNumber,
            reviewUrl: `${process.env.NUXT_PUBLIC_SITE_URL}/review?token=${token}`,
            items,
          },
        })

        c.state.tokensCreated += 1
      }

      if (message.name === 'reviewSubmissions') {
        const { token, productId, orderId, orderNumber, customerEmail, customerName, rating, title, comment } = message.body

        const { collections } = await import('~/server/db/collections')
        const { ObjectId } = await import('mongodb')
        const { reviews, products, orders, reviewTokens } = collections()

        const productObjectId = new ObjectId(productId)
        const orderObjectId = new ObjectId(orderId)
        const reviewedAt = new Date()

        // 1. Insert the review document
        await reviews.insertOne({
          productId: productObjectId,
          orderId: orderObjectId,
          orderNumber,
          customerEmail,
          customerName,
          rating,
          title,
          comment,
          createdAt: reviewedAt,
        })

        // 2. Update product.reviewStats — Computed Pattern
        // Recalculate average from all reviews
        const aggregation = await reviews.aggregate([
          { $match: { productId: productObjectId } },
          { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ]).toArray()

        const newStats = aggregation[0]
          ? { averageRating: Math.round(aggregation[0].avg * 10) / 10, totalCount: aggregation[0].count }
          : { averageRating: rating, totalCount: 1 }

        await products.updateOne(
          { _id: productObjectId },
          { $set: { reviewStats: newStats } }
        )

        // 3. Notify catalogActor to update in-memory stats
        const client = c.client<typeof import('../registry').registry>()
        await client.catalogActor
          .getOrCreate(['main'])
          .updateReviewStats(productId, newStats)

        // 4. Embed review in order item
        await orders.updateOne(
          { _id: orderObjectId, 'items.productId': productObjectId },
          {
            $set: {
              'items.$.review': {
                rating,
                title,
                comment,
                createdAt: reviewedAt,
              },
            },
          }
        )

        // 5. Mark review token as used
        await reviewTokens.updateOne({ token }, { $set: { usedAt: new Date() } })

        c.state.reviewsProcessed += 1
      }
    }
  },
  actions: {
    getStats: (c) => ({
      tokensCreated: c.state.tokensCreated,
      reviewsProcessed: c.state.reviewsProcessed,
    }),
  },
})
