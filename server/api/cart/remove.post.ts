import { z } from 'zod'
import { useRivet } from '~/server/rivet/client'
import { getCartSessionId } from '~/server/utils/cart-session'

const removeItemSchema = z.object({
  productId: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const sessionId = getCartSessionId(event)
  const body = await readValidatedBody(event, removeItemSchema.parse)

  const rivet = useRivet()
  const cart = rivet.cartActor.getOrCreate([sessionId])
  await cart.removeItem(body.productId)
  return cart.getCart()
})
