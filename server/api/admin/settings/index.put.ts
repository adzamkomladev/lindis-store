import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { z } from 'zod'

const settingsUpdateSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.any(),
  })),
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, settingsUpdateSchema.parse)

  try {
    const rivet = useRivet()
    const updates: Record<string, any> = {}
    for (const { key, value } of body.settings) {
      updates[key] = value
    }

    const updated = await rivet.settingsActor.getOrCreate(['main']).update(updates)
    return { success: true, settings: updated }
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    // Settings actor is unavailable — return a 503 so the admin UI knows
    throw createError({
      statusCode: 503,
      statusMessage: 'Settings service temporarily unavailable. Please try again.',
    })
  }
})
