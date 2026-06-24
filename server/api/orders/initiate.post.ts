import { initiateOrderSchema } from '~~/schemas/order.schema'
import { nanoid } from 'nanoid'
import { useRivet } from '~/server/rivet/client'
import { ObjectId } from 'mongodb'
import { collections } from '~/server/utils/db'
import type { OrderDoc, OrderItemDoc } from '~/server/db/types'

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

  // 4. Create the MongoDB order document first so it exists regardless of actor state
  const { orders } = collections()
  const orderDoc: OrderDoc = {
    orderNumber,
    userId: userId ?? undefined,
    guestEmail: body.email,
    status: 'pending',
    paymentStatus: 'unpaid',
    subtotal,
    discountAmount,
    total,
    discount: discount
      ? { code: discount.code, type: discount.type, value: discount.value }
      : null,
    items: body.items.map((item: any): OrderItemDoc => ({
      productId: new ObjectId(item.id),
      productName: item.name,
      productSlug: item.slug,
      productImages: item.images ?? [],
      quantity: item.quantity,
      priceAtPurchase: item.price,
      customText: item.customText,
    })),
    payment: {
      reference,
      provider: 'paystack',
      amount: total,
      status: 'pending',
    },
    shippingDetails: {
      name: body.name,
      phone: body.phone,
      address: body.address,
      city: body.city,
    },
    createdAt: new Date(),
  }
  await orders.insertOne(orderDoc)

  // 5. Initialize Paystack transaction
  const callback_url = `${config.public.baseUrl}/api/orders/verify`
  const paystackData = await initializeTransaction({
    email: body.email,
    amount: total,
    reference,
    callback_url,
    metadata: { orderNumber },
  })

  // 6. Kick off the order workflow actor (reserves inventory, waits for payment)
  const rivet = useRivet()
  const orderActor = rivet.orderActor.getOrCreate([orderNumber])
  await orderActor.send('commands', {
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

  return {
    url: paystackData.authorization_url,
    orderNumber,
    reference,
  }
})
