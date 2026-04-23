import { updateProductSchema } from '~~/schemas/product.schema'
import { useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Product ID is required' })

  const body = await readValidatedBody(event, updateProductSchema.parse)

  // Update via catalogActor — updates both MongoDB and in-memory index
  const rivet = useRivet()
  const updated = await rivet.catalogActor.getOrCreate(['main']).updateProduct(id, body)

  return updated
})
