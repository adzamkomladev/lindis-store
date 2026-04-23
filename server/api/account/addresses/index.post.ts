import { z } from 'zod'
import { collections } from '~/server/utils/db'
import { ObjectId } from 'mongodb'

const createAddressSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  isDefault: z.boolean().default(false),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const user = session.user

  if (!user || user.role !== 'customer') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const body = await readValidatedBody(event, createAddressSchema.parse)
  const { addresses } = collections()
  const userId = new ObjectId(user.id)

  // If setting as default, unset other defaults
  if (body.isDefault) {
    await addresses.updateMany({ userId }, { $set: { isDefault: false } })
  }

  const result = await addresses.insertOne({
    userId,
    name: body.name,
    phone: body.phone,
    address: body.address,
    city: body.city,
    isDefault: body.isDefault,
    createdAt: new Date(),
  })

  return { id: result.insertedId.toString(), ...body }
})
