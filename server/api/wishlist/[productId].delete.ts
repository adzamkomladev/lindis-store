import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user || user.role !== 'customer') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const productId = getRouterParam(event, 'productId')
  if (!productId || !/^[a-f\d]{24}$/i.test(productId)) {
    throw createError({ statusCode: 400, message: 'Invalid product ID' })
  }

  const { wishlist } = collections()
  const userId = new ObjectId(user.id)

  await wishlist.deleteOne({
    userId,
    productId: new ObjectId(productId),
  })

  return { success: true }
})
