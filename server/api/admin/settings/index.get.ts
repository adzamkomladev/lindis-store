import { useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const rivet = useRivet()
  return await rivet.settingsActor.getOrCreate(['main']).getAll()
})
