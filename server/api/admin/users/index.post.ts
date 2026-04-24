import { collections } from '~/server/utils/db'
import { createUserSchema } from '~~/schemas/user.schema'
import { enqueueEmail } from '~/server/utils/queues'

function generateRandomPassword(length: number = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, createUserSchema.parse)

  const role = body.role ?? 'customer'

  const { users } = collections()

  const existing = await users.findOne({ email: body.email })
  if (existing) throw createError({ statusCode: 400, message: 'A user with this email already exists' })

  const generatedPassword = generateRandomPassword()
  const now = new Date()

  const result = await users.insertOne({
    email: body.email,
    name: body.name,
    role: role,
    credentials: [
      {
        provider: 'local',
        passwordHash: await hashPassword(generatedPassword),
      },
    ],
    createdAt: now,
    updatedAt: now,
  })

  // Send credentials via Rivet emailWorker
  try {
    await enqueueEmail({
      to: body.email,
      subject: 'Your Account Has Been Created',
      templateId: 'admin_created',
      data: { name: body.name, email: body.email, password: generatedPassword },
    })
  } catch (error) {
    console.error('[Users] Failed to queue welcome email:', error)
  }

  return {
    success: true,
    user: { _id: result.insertedId.toString(), email: body.email, name: body.name, role },
    temporaryPassword: generatedPassword,
  }
})
