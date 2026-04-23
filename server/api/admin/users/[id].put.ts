import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'
import { updateUserSchema } from '~~/schemas/user.schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) throw createError({ statusCode: 400, message: 'Valid user ID required' })

  const body = await readValidatedBody(event, updateUserSchema.parse)
  const { users } = collections()

  const result = await users.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { ...body, updatedAt: new Date() } },
    { returnDocument: 'after', projection: { credentials: 0 } }
  )

  if (!result) throw createError({ statusCode: 404, message: 'User not found' })

  return { success: true, user: result }
})
