import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { z } from 'zod'

const settingsUpdateSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })),
})

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, settingsUpdateSchema.parse)

  try {
    const rivet = useRivet()
    
    // Transform array to object format for actor
    const updates: Record<string, any> = {}
    for (const { key, value } of body.settings) {
      // Map frontend keys to actor keys
      const keyMap: Record<string, string> = {
        store_name: 'storeName',
        support_email: 'storeEmail',
        currency: 'currency',
        banner_text: 'bannerText',
        notif_order: 'notifOrder',
        notif_new: 'notifNew',
        notif_stock: 'notifStock',
      }
      const actorKey = keyMap[key] || key
      updates[actorKey] = value
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
