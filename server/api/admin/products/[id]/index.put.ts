import { updateProductSchema } from '~~/schemas/product.schema'
import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Product ID is required' })

  const body = await readValidatedBody(event, updateProductSchema.parse)

  try {
    // Update via catalogActor — updates both MongoDB and in-memory index
    const rivet = useRivet()
    const updated = await rivet.catalogActor.getOrCreate(['main']).updateProduct(id, body)
    return updated
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn(`[Rivet] Falling back to MongoDB for product update: ${id}`)
    await connectDB()
    const { products } = collections()

    const objectId = new ObjectId(id)
    const now = new Date()
    const updateDoc = { ...body, updatedAt: now }

    await products.updateOne({ _id: objectId }, { $set: updateDoc })
    const updated = await products.findOne({ _id: objectId })

    if (!updated) throw createError({ statusCode: 404, message: 'Product not found' })
    return updated
  }
})
