import { productSchema } from '~~/schemas/product.schema'
import { useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, productSchema.parse)

  const slug = body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const priceInPesewas = Math.round(body.price * 100)

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
    product._id!.toString(),
    product.inventoryCount
  )

  return product
})