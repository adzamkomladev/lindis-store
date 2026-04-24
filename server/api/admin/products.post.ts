import { productSchema } from '~~/schemas/product.schema'
import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, productSchema.parse)

  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const priceInPesewas = Math.round(body.price * 100)

  try {
    const rivet = useRivet()
    const product = await rivet.catalogActor.getOrCreate(['main']).createProduct({
      name: body.name,
      slug: `${slug}-${Date.now()}`,
      description: body.description,
      price: priceInPesewas,
      currency: 'GHS',
      inventoryCount: body.inventoryCount,
      status: body.status ?? 'draft',
      isFeatured: body.isFeatured ?? false,
      images: body.images ?? [],
      category: body.category ?? 'kitchen',
      // Polymorphic pattern — standard product type by default
      type: 'standard',
      specs: {
        material: body.specMaterial,
        capacity: body.specCapacity,
        dimensions: body.specDimensions,
        weight: body.specWeight,
        insulation: body.specInsulation,
        tempRetention: body.specTempRetention,
      },
    })

    // Sync inventory count to inventoryActor
    await rivet.inventoryActor.getOrCreate(['main']).setStock(
      product._id,
      product.inventoryCount
    )

    return product
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to MongoDB for product creation')
    await connectDB()
    const { products } = collections()

    const now = new Date()
    const productDoc = {
      name: body.name,
      slug: `${slug}-${Date.now()}`,
      description: body.description,
      price: priceInPesewas,
      currency: 'GHS',
      inventoryCount: body.inventoryCount,
      status: body.status ?? 'draft',
      isFeatured: body.isFeatured ?? false,
      images: body.images ?? [],
      category: body.category ?? 'kitchen',
      type: 'standard' as const,
      reviewStats: { averageRating: 0, totalCount: 0 },
      specs: {
        material: body.specMaterial,
        capacity: body.specCapacity,
        dimensions: body.specDimensions,
        weight: body.specWeight,
        insulation: body.specInsulation,
        tempRetention: body.specTempRetention,
      },
      createdAt: now,
      updatedAt: now,
    }

    const result = await products.insertOne(productDoc as any)
    return { ...productDoc, _id: result.insertedId.toString() }
  }
})