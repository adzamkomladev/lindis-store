import { z } from 'zod'
import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, resetPasswordSchema.parse)
  const { passwordResetTokens, users } = collections()

  const tokenDoc = await passwordResetTokens.findOne({ token: body.token })

  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    throw createError({ statusCode: 400, message: 'Invalid or expired token' })
  }

  // Update user password
  const passwordHash = await hashPassword(body.password)

  await users.updateOne(
    { _id: tokenDoc.userId },
    {
      $set: {
        'credentials.$[cred].passwordHash': passwordHash,
        updatedAt: new Date(),
      },
    },
    {
      arrayFilters: [{ 'cred.provider': 'local' }],
    }
  )

  // Delete used token
  await passwordResetTokens.deleteOne({ _id: tokenDoc._id })

  return { success: true }
})
