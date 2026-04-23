import { collections } from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)
  const { orders } = collections()

  const result = await orders
    .find({})
    .sort({ createdAt: -1 })
    .toArray()

  return result
})
