import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'
import { enqueueEmail } from '~/server/utils/queues'

function generateRandomPassword(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) throw createError({ statusCode: 400, message: 'Valid user ID required' })

  const { users } = collections()

  const user = await users.findOne({ _id: new ObjectId(id) })
  if (!user) throw createError({ statusCode: 404, message: 'User not found' })

  const localCred = user.credentials.find(c => c.provider === 'local')
  if (!localCred) throw createError({ statusCode: 400, message: 'User does not have a credentials account' })

  const newPassword = generateRandomPassword()

  // Update credentials in embedded array
  await users.updateOne(
    { _id: new ObjectId(id), 'credentials.provider': 'local' },
    { $set: { 'credentials.$.passwordHash': await hashPassword(newPassword), updatedAt: new Date() } }
  )

  // Send new password via emailWorker
  try {
    await enqueueEmail({
      to: user.email,
      subject: 'Your Password Has Been Reset',
      templateId: 'password_reset',
      data: { name: user.name ?? 'User', email: user.email, password: newPassword },
    })
  } catch (error) {
    console.error('[Users] Failed to queue reset email:', error)
  }

  return { success: true, temporaryPassword: newPassword }
})
