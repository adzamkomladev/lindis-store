import { validateDiscountSchema } from '~~/schemas/discount-code.schema'
import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, validateDiscountSchema.parse)
  const code = body.code.toUpperCase()

  const { discountCodes } = collections()

  const discountCode = await discountCodes.findOne({ code })

  if (!discountCode) throw createError({ statusCode: 404, message: 'Discount code not found.' })
  if (!discountCode.isActive) throw createError({ statusCode: 400, message: 'This discount code is inactive.' })

  const now = new Date()
  if (discountCode.startsAt && now < discountCode.startsAt) {
    throw createError({ statusCode: 400, message: 'This discount code is not yet active.' })
  }
  if (discountCode.expiresAt && now > discountCode.expiresAt) {
    throw createError({ statusCode: 400, message: 'This discount code has expired.' })
  }
  if (discountCode.maxUses != null && discountCode.usedCount >= discountCode.maxUses) {
    throw createError({ statusCode: 400, message: 'This discount code has reached its usage limit.' })
  }
  if (discountCode.minOrderAmount != null && body.cartTotal < discountCode.minOrderAmount) {
    const minFormatted = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(discountCode.minOrderAmount / 100)
    throw createError({ statusCode: 400, message: `Minimum order of ${minFormatted} required for this code.` })
  }
  if (discountCode.minQuantity != null && body.cartQuantity < discountCode.minQuantity) {
    throw createError({ statusCode: 400, message: `Minimum ${discountCode.minQuantity} items required.` })
  }
  if (discountCode.productId && body.productIds && !body.productIds.map(String).includes(discountCode.productId.toString())) {
    throw createError({ statusCode: 400, message: 'This code is not valid for the items in your cart.' })
  }

  // Calculate discount amount
  let discountAmount = 0
  if (discountCode.type === 'percentage') {
    discountAmount = Math.floor(body.cartTotal * (discountCode.value / 100))
  } else if (discountCode.type === 'fixed') {
    discountAmount = Math.min(discountCode.value, body.cartTotal)
  }

  return {
    valid: true,
    code: discountCode.code,
    type: discountCode.type,
    value: discountCode.value,
    discountAmount,
    description: discountCode.description,
  }
})
