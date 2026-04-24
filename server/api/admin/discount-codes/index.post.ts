import { collections } from '~/server/utils/db'
import { createDiscountCodeSchema } from '~~/schemas/discount-code.schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const body = await readValidatedBody(event, createDiscountCodeSchema.parse)

  if (body.type === 'percentage' && body.value > 100) {
    throw createError({ statusCode: 400, message: 'Percentage cannot exceed 100' })
  }

  const { discountCodes } = collections()
  const { ObjectId } = await import('mongodb')

  const valueInPesewas = body.type === 'fixed' ? Math.round(body.value * 100) : body.value
  const minOrderInPesewas = body.minOrderAmount ? Math.round(body.minOrderAmount * 100) : undefined

  const now = new Date()
  const doc = {
    code: body.code.toUpperCase(),
    description: body.description,
    type: body.type,
    value: valueInPesewas,
    minOrderAmount: minOrderInPesewas,
    minQuantity: body.minQuantity,
    maxUses: body.maxUses,
    usedCount: 0,
    productId: body.productId ? new ObjectId(body.productId) : undefined,
    categoryName: body.categoryName,
    startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    isActive: body.isActive ?? true,
    createdAt: now,
  }

  const result = await discountCodes.insertOne(doc as any)
  return { ...doc, _id: result.insertedId.toString() }
})
