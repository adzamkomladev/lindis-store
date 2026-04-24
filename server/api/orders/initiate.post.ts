import { initiateOrderSchema } from '~~/schemas/order.schema'
import { nanoid } from 'nanoid'
import { useRivet, isRivetRunnerUnavailable } from '~/server/rivet/client'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, initiateOrderSchema.parse)
  const config = useRuntimeConfig()
  const { initializeTransaction } = usePaystack()

  // Check if customer is logged in
  const session = await getUserSession(event)
  const userId = session.user?.role === 'customer' ? new ObjectId(session.user.id) : undefined

  // 1. Generate unique order number & Paystack reference
  const orderNumber = `ls-${nanoid(8).toLowerCase()}`
  const reference = `pay-${orderNumber}`

  // 2. Calculate totals — cart actor or client-side cart
  const subtotal = body.items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
  const cartQuantity = body.items.reduce((acc: number, item: any) => acc + item.quantity, 0)

  // 3. Validate discount code if provided
  let discount: { code: string; type: string; value: number; discountAmount: number } | null = null
  let discountAmount = 0

  if (body.discountCode) {
    const { collections } = await import('~/server/db/collections')
    const { discountCodes } = collections()
    const now = new Date()

    const dc = await discountCodes.findOne({
      code: body.discountCode.toUpperCase(),
      isActive: true,
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    })

    if (dc && (!dc.maxUses || dc.usedCount < dc.maxUses)) {
      const isValid =
        (!dc.minOrderAmount || subtotal >= dc.minOrderAmount) &&
        (!dc.minQuantity || cartQuantity >= dc.minQuantity)

      if (isValid) {
        if (dc.type === 'percentage') {
          discountAmount = Math.floor(subtotal * (dc.value / 100))
        } else if (dc.type === 'fixed') {
          discountAmount = Math.min(dc.value, subtotal)
        }
        discount = { code: dc.code, type: dc.type, value: dc.value, discountAmount }
      }
    }
  }

  const total = Math.max(0, subtotal - discountAmount)

  // 4. Initialize Paystack transaction
  const callback_url = `${config.public.baseUrl}/api/orders/verify`
  const paystackData = await initializeTransaction({
    email: body.email,
    amount: total,
    reference,
    callback_url,
    metadata: { orderNumber },
  })

  // 5. Kick off the order workflow actor (creates order, reserves inventory)
  try {
    const rivet = useRivet()
    const orderActor = rivet.orderActor.getOrCreate([orderNumber])
    await orderActor.commands.push({
      type: 'initiate',
      userId: userId?.toString(),
      guestEmail: body.email,
      items: body.items.map((item: any) => ({
        productId: item.id,
        productName: item.name,
        productSlug: item.slug,
        productImages: item.images ?? [],
        price: item.price,
        quantity: item.quantity,
        customText: item.customText,
      })),
      discount,
      shippingDetails: {
        name: body.name,
        phone: body.phone,
        address: body.address,
        city: body.city,
      },
      paystackReference: reference,
    })
  } catch (error) {
    if (!isRivetRunnerUnavailable(error)) throw error

    console.warn(`[Rivet] Order actor unavailable for ${orderNumber}. Payment initialized but order workflow deferred.`)
    // Return 503 so the frontend can retry or show an error
    throw createError({
      statusCode: 503,
      statusMessage: 'Order service temporarily unavailable. Please try again.',
    })
  }

  return {
    url: paystackData.authorization_url,
    orderNumber,
    reference,
  }
})
