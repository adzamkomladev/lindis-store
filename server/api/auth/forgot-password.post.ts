import { z } from 'zod'
import { collections } from '~/server/utils/db'
import { nanoid } from 'nanoid'
import { EmailTemplate } from '~~/types/email'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, forgotPasswordSchema.parse)
  const { users, passwordResetTokens } = collections()
  const config = useRuntimeConfig()

  const user = await users.findOne({ email: body.email })
  if (!user) {
    // Return success even if user not found to prevent email enumeration
    return { success: true }
  }

  // Generate token
  const token = nanoid(32)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await passwordResetTokens.insertOne({
    userId: user._id!,
    token,
    expiresAt,
    createdAt: new Date(),
  })

  // Send reset email
  const resetUrl = `${config.public.baseUrl}/reset-password/${token}`

  const { sendTemplatedEmail } = await import('~/server/utils/email')
  await sendTemplatedEmail(
    { email: user.email, name: user.name },
    'Reset Your Password',
    EmailTemplate.ADMIN_CREATED, // Reusing generic template — user should create a dedicated password reset template in Maileroo
    {
      name: user.name || 'Customer',
      resetUrl,
      expiresIn: '1 hour',
    }
  )

  return { success: true }
})
