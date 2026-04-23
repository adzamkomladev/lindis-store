import { useRivet } from '~/server/rivet/client'
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
  const rivet = useRivet()

  const updates: Record<string, any> = {}
  for (const { key, value } of body.settings) {
    updates[key] = value
  }

  const updated = await rivet.settingsActor.getOrCreate(['main']).update(updates)
  return { success: true, settings: updated }
})
