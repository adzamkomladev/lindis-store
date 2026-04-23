import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import { isRivetRunnerUnavailable, useRivet } from '~/server/rivet/client'

export default cachedEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Missing slug' })

  try {
    const rivet = useRivet()
    const product = await rivet.catalogActor.getOrCreate(['main']).getProduct(slug)

    if (!product) throw createError({ statusCode: 404, message: 'Product not found' })

    return product
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn(`[Rivet] Falling back to MongoDB for product slug: ${slug}`)
    await connectDB()
    const { products } = collections()
    const product = await products.findOne({ slug, status: 'active' })

    if (!product) throw createError({ statusCode: 404, message: 'Product not found' })

    return product
  }
}, {
  maxAge: 60 * 60, // 1 hour cache — invalidated when catalogActor updates
  name: 'product-details',
  getKey: (event) => getRouterParam(event, 'slug')!,
})
