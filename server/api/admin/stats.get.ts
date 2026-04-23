import { useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const rivet = useRivet()
  return await rivet.analyticsActor.getOrCreate(['main']).getDashboardStats()
})
