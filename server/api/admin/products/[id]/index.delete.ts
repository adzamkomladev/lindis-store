import { useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Product ID is required' })

  // Delete via catalogActor — removes from MongoDB and in-memory index
  const rivet = useRivet()
  await rivet.catalogActor.getOrCreate(['main']).deleteProduct(id)

  return { success: true }
})
