import { z } from 'zod'
import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  phone: z.string().min(10).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user || user.role !== 'customer') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readValidatedBody(event, updateProfileSchema.parse)

  const { users } = collections()
  const updateData: any = { updatedAt: new Date() }
  if (body.name !== undefined) updateData.name = body.name

  await users.updateOne(
    { _id: new ObjectId(user.id) },
    { $set: updateData }
  )

  // Refresh session name if changed
  if (body.name !== undefined) {
    await setUserSession(event, {
      user: {
        ...user,
        name: body.name,
      },
    })
  }

  return { success: true }
})
