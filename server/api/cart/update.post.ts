import { z } from 'zod'
import { useRivet } from '~/server/rivet/client'
import { getCartSessionId } from '~/server/utils/cart-session'

const updateQuantitySchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(0),
})

export default defineEventHandler(async (event) => {
  const sessionId = getCartSessionId(event)
  const body = await readValidatedBody(event, updateQuantitySchema.parse)

  const rivet = useRivet()
  const cart = rivet.cartActor.getOrCreate([sessionId])
  await cart.updateQuantity(body.productId, body.quantity)
  return cart.getCart()
})
