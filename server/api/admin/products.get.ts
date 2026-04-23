import { useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const rivet = useRivet()
  // All products including drafts — for admin view
  return await rivet.catalogActor.getOrCreate(['main']).getProducts({ status: undefined as any })
})