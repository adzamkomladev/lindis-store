import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  try {
    const rivet = useRivet()
    // All products including drafts — for admin view
    return await rivet.catalogActor.getOrCreate(['main']).getProducts({ status: undefined as any })
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to MongoDB for admin product list')
    await connectDB()
    const { products } = collections()
    return await products.find().sort({ createdAt: -1 }).toArray()
  }
})