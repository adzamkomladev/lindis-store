import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user || user.role !== 'customer') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { wishlist, products } = collections()
  const userId = new ObjectId(user.id)

  const items = await wishlist
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray()

  const productIds = items.map(i => i.productId)
  const productDocs = await products
    .find({ _id: { $in: productIds } })
    .toArray()

  const productMap = new Map(productDocs.map(p => [p._id!.toString(), p]))

  return items.map(item => {
    const product = productMap.get(item.productId.toString())
    return {
      id: item._id!.toString(),
      productId: item.productId.toString(),
      name: product?.name || 'Unknown Product',
      slug: product?.slug || '',
      price: product?.price || 0,
      images: product?.images || [],
      category: product?.category || '',
      reviewStats: product?.reviewStats || { averageRating: 0, totalCount: 0 },
    }
  })
})
