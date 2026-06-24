import { z } from 'zod'
import { useRivet } from '~/server/rivet/client'
import { getCartSessionId } from '~/server/utils/cart-session'

const discountSchema = z.object({
  code: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const sessionId = getCartSessionId(event)
  const body = await readValidatedBody(event, discountSchema.parse)

  const rivet = useRivet()
  const cart = rivet.cartActor.getOrCreate([sessionId])
  const discount = await cart.applyDiscount(body.code)
  return { discount, ...await cart.getCart() }
})
