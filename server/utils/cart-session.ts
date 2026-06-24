import { nanoid } from 'nanoid'

/**
 * Resolve (or create) the cart session ID from a cookie.
 * The session ID is used as the cartActor's actor key so each
 * visitor gets their own isolated cart.
 */
export function getCartSessionId(event: any): string {
  const cookie = getCookie(event, 'cart_session')
  if (cookie) return cookie

  const id = nanoid(16)
  setCookie(event, 'cart_session', id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })
  return id
}
