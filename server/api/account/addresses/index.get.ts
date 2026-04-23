import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user || user.role !== 'customer') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const { addresses } = collections()
  const userId = new ObjectId(user.id)

  const userAddresses = await addresses
    .find({ userId })
    .sort({ isDefault: -1, createdAt: -1 })
    .toArray()

  return userAddresses.map(addr => ({
    id: addr._id!.toString(),
    name: addr.name,
    phone: addr.phone,
    address: addr.address,
    city: addr.city,
    isDefault: addr.isDefault,
  }))
})
