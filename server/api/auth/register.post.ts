import { registerSchema } from '~~/schemas/auth.schema'
import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, registerSchema.parse)

  const { users } = collections()

  // Check if email already exists
  const existingUser = await users.findOne({ email: body.email })
  if (existingUser) {
    throw createError({ statusCode: 409, message: 'An account with this email already exists' })
  }

  // Create customer with embedded credentials
  const now = new Date()
  const result = await users.insertOne({
    email: body.email,
    name: body.name,
    role: 'customer',
    credentials: [
      {
        provider: 'local',
        passwordHash: await hashPassword(body.password),
      },
    ],
    createdAt: now,
    updatedAt: now,
  })

  // Auto-login after registration
  await setUserSession(event, {
    user: {
      id: result.insertedId.toString(),
      email: body.email,
      name: body.name,
      role: 'customer',
    },
  })

  return { success: true, user: { id: result.insertedId.toString(), email: body.email, name: body.name } }
})
