import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'
import { reviewQuerySchema } from '~~/schemas/review.schema'

export default defineEventHandler(async (event) => {
  const productId = getRouterParam(event, 'productId')
  if (!productId) throw createError({ statusCode: 400, message: 'Product ID is required' })

  const query = await getValidatedQuery(event, reviewQuerySchema.parse)
  const { reviews, products } = collections()

  if (!ObjectId.isValid(productId)) {
    throw createError({ statusCode: 400, message: 'Invalid product ID' })
  }

  const productObjectId = new ObjectId(productId)

  // Build cursor-based pagination filter
  const filter: any = { productId: productObjectId }
  if (query.cursor && ObjectId.isValid(query.cursor)) {
    filter._id = { $lt: new ObjectId(query.cursor) }
  }

  const reviewsList = await reviews
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(query.limit + 1)
    .toArray()

  const hasMore = reviewsList.length > query.limit
  const items = hasMore ? reviewsList.slice(0, query.limit) : reviewsList
  const nextCursor = hasMore ? items[items.length - 1]?._id?.toString() ?? null : null

  // Get pre-computed stats from product (Computed Pattern — no aggregation needed)
  const product = await products.findOne(
    { _id: productObjectId },
    { projection: { reviewStats: 1 } }
  )

  return {
    reviews: items,
    averageRating: product?.reviewStats?.averageRating ?? 0,
    totalCount: product?.reviewStats?.totalCount ?? 0,
    nextCursor,
  }
})
