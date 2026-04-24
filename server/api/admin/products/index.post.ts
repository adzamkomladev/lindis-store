import { productSchema } from '~~/schemas/product.schema'
import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import type { CreateProductInput } from '~/server/db/types'

// Simple slugify utility
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const body = await readValidatedBody(event, productSchema.parse)

  // Prepare product document
  const now = new Date()
  const slug = slugify(body.name)
  
  const productData: CreateProductInput = {
    name: body.name,
    slug,
    description: body.description,
    price: Math.round(body.price * 100), // Convert GHS to pesewas
    currency: 'GHS',
    inventoryCount: body.inventoryCount,
    images: body.images ?? [],
    status: body.status,
    isFeatured: body.isFeatured,
    category: body.category,
    type: 'standard',
    specs: {
      material: body.specMaterial,
      capacity: body.specCapacity,
      dimensions: body.specDimensions,
      weight: body.specWeight,
      insulation: body.specInsulation,
      tempRetention: body.specTempRetention,
    },
  }

  try {
    // Create via catalogActor — inserts into MongoDB and updates in-memory index
    const rivet = useRivet()
    const created = await rivet.catalogActor.getOrCreate(['main']).createProduct(productData)
    return created
  } catch (error: any) {
    if (!isRivetRunnerUnavailable(error)) {
      // Handle slug conflict
      if (error.code === 'slug_taken') {
        throw createError({ statusCode: 400, message: 'A product with this name already exists' })
      }
      throw error
    }

    // Fallback to direct MongoDB
    console.warn('[Rivet] Falling back to MongoDB for product creation')
    await connectDB()
    const { products } = collections()

    // Check for duplicate slug
    const existing = await products.findOne({ slug })
    if (existing) {
      throw createError({ statusCode: 400, message: 'A product with this name already exists' })
    }

    const product = {
      ...productData,
      reviewStats: { averageRating: 0, totalCount: 0 },
      createdAt: now,
      updatedAt: now,
    }

    const result = await products.insertOne(product as any)
    const created = { ...product, _id: result.insertedId.toString() }

    return created
  }
})
