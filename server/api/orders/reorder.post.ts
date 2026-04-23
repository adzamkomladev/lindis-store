import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { orders } = collections()
  const { ObjectId } = await import('mongodb')

  const order = await orders.findOne({ _id: new ObjectId(body.orderId) })
  if (!order) {
    throw createError({ statusCode: 404, message: 'Order not found' })
  }

  // Return items formatted for the cart
  const cartItems = order.items.map(item => ({
    id: item.productId.toString(),
    name: item.productName,
    slug: item.productSlug,
    price: item.priceAtPurchase,
    image: item.productImages?.[0] || '',
    quantity: item.quantity,
    customTexts: Array(item.quantity).fill(''),
  }))

  return { items: cartItems }
})
