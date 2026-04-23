import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user || user.role !== 'customer') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { users } = collections()
  const userDoc = await users.findOne({ _id: new ObjectId(user.id) })

  if (!userDoc) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return {
    id: userDoc._id!.toString(),
    email: userDoc.email,
    name: userDoc.name || '',
    role: userDoc.role,
    createdAt: userDoc.createdAt,
  }
})
