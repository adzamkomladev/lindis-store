import { z } from 'zod'
import { collections } from '~/server/utils/db'

const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, subscribeSchema.parse)
  const { subscribers } = collections()

  try {
    await subscribers.insertOne({
      email: body.email,
      subscribedAt: new Date(),
    })
  } catch (err: any) {
    if (err.code === 11000) {
      // Already subscribed — silently succeed
      return { success: true, alreadySubscribed: true }
    }
    throw err
  }

  return { success: true }
})
