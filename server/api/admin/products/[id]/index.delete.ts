import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Product ID is required' })

  try {
    // Delete via catalogActor — removes from MongoDB and in-memory index
    const rivet = useRivet()
    await rivet.catalogActor.getOrCreate(['main']).deleteProduct(id)
    return { success: true }
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn(`[Rivet] Falling back to MongoDB for product delete: ${id}`)
    await connectDB()
    const { products } = collections()

    await products.deleteOne({ _id: new ObjectId(id) })
    return { success: true }
  }
})
