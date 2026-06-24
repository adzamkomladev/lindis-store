import { z } from 'zod'
import { useRivet } from '~/server/rivet/client'
import { getCartSessionId } from '~/server/utils/cart-session'

const addItemSchema = z.object({
  product: z.object({
    _id: z.string().min(1),
    name: z.string().min(1),
    slug: z.string().min(1),
    images: z.array(z.string()).default([]),
    price: z.number().int().positive(),
  }),
  quantity: z.number().int().positive().default(1),
})

export default defineEventHandler(async (event) => {
  const sessionId = getCartSessionId(event)
  const body = await readValidatedBody(event, addItemSchema.parse)

  const rivet = useRivet()
  const cart = rivet.cartActor.getOrCreate([sessionId])
  await cart.addItem(body.product, body.quantity)
  return cart.getCart()
})
