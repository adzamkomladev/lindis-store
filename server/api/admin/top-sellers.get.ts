import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { orders, products } = collections()

  // Aggregate top selling products from paid orders
  const topSellers = await orders
    .aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.priceAtPurchase', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ])
    .toArray()

  const productIds = topSellers.map((s: any) => s._id)
  const productDocs = await products
    .find({ _id: { $in: productIds } })
    .toArray()

  const productMap = new Map(productDocs.map(p => [p._id!.toString(), p]))

  return topSellers.map((s: any) => {
    const product = productMap.get(s._id.toString())
    return {
      productId: s._id.toString(),
      name: product?.name || 'Unknown Product',
      slug: product?.slug || '',
      price: product?.price || 0,
      images: product?.images || [],
      totalSold: s.totalSold,
      totalRevenue: s.totalRevenue,
    }
  })
})
