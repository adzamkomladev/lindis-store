import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { discountCodes } = collections()
  return await discountCodes.find({}).sort({ createdAt: -1 }).toArray()
})
