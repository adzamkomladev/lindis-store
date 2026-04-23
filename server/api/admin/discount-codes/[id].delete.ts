import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const id = getRouterParam(event, 'id')
  if (!id || !ObjectId.isValid(id)) throw createError({ statusCode: 400, message: 'Valid ID required' })

  const { discountCodes } = collections()
  await discountCodes.deleteOne({ _id: new ObjectId(id) })
  return { success: true }
})
