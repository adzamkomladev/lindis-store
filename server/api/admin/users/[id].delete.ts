import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) throw createError({ statusCode: 400, message: 'Valid user ID required' })

  const session = await getUserSession(event)
  if (session.user?.id === id) {
    throw createError({ statusCode: 400, message: 'You cannot delete your own account' })
  }

  const { users } = collections()
  const result = await users.deleteOne({ _id: new ObjectId(id) })

  if (result.deletedCount === 0) throw createError({ statusCode: 404, message: 'User not found' })

  return { success: true }
})
