import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'
import { updateDiscountCodeSchema } from '~~/schemas/discount-code.schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) throw createError({ statusCode: 400, message: 'Valid ID required' })

  const body = await readValidatedBody(event, updateDiscountCodeSchema.parse)
  const { discountCodes } = collections()

  const updateData: Record<string, any> = { ...body }
  if (body.value !== undefined && body.type === 'fixed') {
    updateData.value = Math.round(body.value * 100)
  }
  if (body.minOrderAmount != null) {
    updateData.minOrderAmount = Math.round(body.minOrderAmount * 100)
  }

  const result = await discountCodes.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: updateData },
    { returnDocument: 'after' }
  )

  if (!result) throw createError({ statusCode: 404, message: 'Discount code not found' })
  return result
})
