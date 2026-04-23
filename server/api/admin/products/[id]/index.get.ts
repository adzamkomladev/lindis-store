import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'Product ID is required' })

  const { products, orders } = collections()

  let productDoc = ObjectId.isValid(id)
    ? await products.findOne({ _id: new ObjectId(id) })
    : await products.findOne({ slug: id })

  if (!productDoc) throw createError({ statusCode: 404, message: 'Product not found' })

  const productObjectId = productDoc._id!

  // Aggregate product stats from embedded order items
  const [statsResult] = await orders.aggregate([
    { $match: { 'items.productId': productObjectId } },
    { $unwind: '$items' },
    { $match: { 'items.productId': productObjectId } },
    {
      $group: {
        _id: null,
        revenue: {
          $sum: {
            $cond: [
              { $eq: ['$paymentStatus', 'paid'] },
              { $multiply: ['$items.priceAtPurchase', '$items.quantity'] },
              0,
            ],
          },
        },
        unitsSold: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$items.quantity', 0] },
        },
        totalOrders: { $sum: 1 },
        pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
      },
    },
  ]).toArray()

  // Recent orders for this product
  const recentOrders = await orders.aggregate([
    { $match: { 'items.productId': productObjectId } },
    { $unwind: '$items' },
    { $match: { 'items.productId': productObjectId } },
    { $sort: { createdAt: -1 } },
    { $limit: 10 },
    {
      $project: {
        orderNumber: 1,
        guestEmail: 1,
        status: 1,
        paymentStatus: 1,
        quantity: '$items.quantity',
        priceAtPurchase: '$items.priceAtPurchase',
        createdAt: 1,
      },
    },
  ]).toArray()

  return {
    product: productDoc,
    stats: {
      revenue: statsResult?.revenue ?? 0,
      totalOrders: statsResult?.totalOrders ?? 0,
      pendingOrders: statsResult?.pendingOrders ?? 0,
      unitsSold: statsResult?.unitsSold ?? 0,
    },
    recentOrders,
  }
})
