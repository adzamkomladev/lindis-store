import { collections } from '~/server/db/collections'
import { connectDB } from '~/server/db/mongodb'
import { isRivetRunnerUnavailable, useRivet } from '~/server/rivet/client'

export default cachedEventHandler(async (event) => {
  const query = getQuery(event)
  const category = (query.category as string) || undefined
  const sort = (query.sort as string) || 'newest'
  const page = Math.max(1, parseInt(query.page as string || '1', 10))
  const limit = Math.min(48, Math.max(1, parseInt(query.limit as string || '12', 10)))
  const skip = (page - 1) * limit

  try {
    const rivet = useRivet()
    let products = await rivet.catalogActor.getOrCreate(['main']).getProducts({
      status: 'active',
      category,
    })

    // Sort
    if (sort === 'price-low') {
      products = products.sort((a, b) => a.price - b.price)
    } else if (sort === 'price-high') {
      products = products.sort((a, b) => b.price - a.price)
    } else if (sort === 'rating') {
      products = products.sort((a, b) => (b.reviewStats?.averageRating || 0) - (a.reviewStats?.averageRating || 0))
    } else {
      // newest
      products = products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    const total = products.length
    const paginated = products.slice(skip, skip + limit)

    return { products: paginated, total, page, totalPages: Math.ceil(total / limit) }
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn('[Rivet] Falling back to MongoDB for product list:', (error as Error).message)
    await connectDB()
    const { products } = collections()

    const filter: any = { status: 'active' }
    if (category && category !== 'all') {
      filter.category = category
    }

    let sortOption: any = { createdAt: -1 }
    if (sort === 'price-low') sortOption = { price: 1 }
    if (sort === 'price-high') sortOption = { price: -1 }
    if (sort === 'rating') sortOption = { 'reviewStats.averageRating': -1 }

    const total = await products.countDocuments(filter)
    const results = await products
      .find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .toArray()

    return { products: results, total, page, totalPages: Math.ceil(total / limit) }
  }
}, {
  maxAge: 60 * 60,
  name: 'all-products',
})
