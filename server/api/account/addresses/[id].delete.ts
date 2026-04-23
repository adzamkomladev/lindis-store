import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user || user.role !== 'customer') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    throw createError({ statusCode: 400, message: 'Invalid address ID' })
  }

  const { addresses } = collections()
  const userId = new ObjectId(user.id)

  const result = await addresses.deleteOne({
    _id: new ObjectId(id),
    userId,
  })

  if (result.deletedCount === 0) {
    throw createError({ statusCode: 404, message: 'Address not found' })
  }

  return { success: true }
})
