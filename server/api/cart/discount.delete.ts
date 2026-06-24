import { useRivet } from '~/server/rivet/client'
import { getCartSessionId } from '~/server/utils/cart-session'

export default defineEventHandler(async (event) => {
  const sessionId = getCartSessionId(event)

  const rivet = useRivet()
  const cart = rivet.cartActor.getOrCreate([sessionId])
  await cart.removeDiscount()
  return cart.getCart()
})
