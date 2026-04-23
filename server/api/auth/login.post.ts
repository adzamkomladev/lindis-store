import { loginSchema } from '~~/schemas/auth.schema'
import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, loginSchema.parse)

  const { users } = collections()

  // Single query — user with credentials embedded (1:1 embed pattern)
  const user = await users.findOne({ email: body.email })
  if (!user) {
    console.log('[Login] No user found with email:', body.email)
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  // Find local credentials in embedded array
  const localCredential = user.credentials.find(c => c.provider === 'local')
  if (!localCredential?.passwordHash) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  const valid = await verifyPassword(localCredential.passwordHash, body.password)
  if (!valid) {
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  await setUserSession(event, {
    user: {
      id: user._id!.toString(),
      email: user.email,
      name: user.name ?? '',
      role: user.role,
    },
  })

  return { success: true }
})