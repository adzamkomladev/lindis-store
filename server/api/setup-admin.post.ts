import { setupSchema } from '~~/schemas/user.schema'
import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, setupSchema.parse)

  const { users } = collections()

  // Check if any admin already exists
  const existingAdmin = await users.findOne({ role: 'admin' })
  if (existingAdmin) {
    throw createError({ statusCode: 403, message: 'Admin already exists' })
  }

  // Create admin with embedded credentials (1:1 embed pattern — no separate accounts table)
  const now = new Date()
  await users.insertOne({
    email: body.email,
    name: body.name || 'Admin',
    role: 'admin',
    credentials: [
      {
        provider: 'local',
        passwordHash: await hashPassword(body.password),
      },
    ],
    createdAt: now,
    updatedAt: now,
  })

  return { success: true }
})