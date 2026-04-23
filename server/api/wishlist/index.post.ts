import { z } from 'zod'
import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

const schema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid product ID'),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user || user.role !== 'customer') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readValidatedBody(event, schema.parse)
  const { wishlist } = collections()
  const userId = new ObjectId(user.id)
  const productId = new ObjectId(body.productId)

  try {
    await wishlist.insertOne({
      userId,
      productId,
      createdAt: new Date(),
    })
  } catch (err: any) {
    if (err.code === 11000) {
      // Already in wishlist
      return { success: true, alreadyExists: true }
    }
    throw err
  }

  return { success: true }
})
