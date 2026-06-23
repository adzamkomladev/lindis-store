/**
 * RivetKit Serverless Plugin
 *
 * Serverless mode: the engine sends HTTP POST to /api/rivet/start to wake
 * actors. No persistent WebSocket needed — actors are created/destroyed per
 * request via the engine API.
 *
 * We switched to serverless because the self-hosted engine's guard requires
 * x-rivet-token HTTP header for WS auth, but the RivetKit SDK only sends
 * auth via Sec-WebSocket-Protocol subprotocol (WebSocket API limitation).
 * Serverless uses HTTP REST which sends auth via the Authorization header
 * or URL-embedded credentials, both of which work correctly.
 *
 * The engine pool must be configured as 'serverless' kind with the app's
 * URL (https://lindis-store.tangle.africa/api/rivet).
 */

import { connectDB } from '~/server/db/mongodb'

export default defineNitroPlugin(async () => {
  // Connect MongoDB (actors need DB access)
  try {
    await connectDB()
  } catch (e) {
    console.warn('[rivet-serverless] MongoDB initial connect failed, retrying...')
  }

  const siteUrl = process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  console.log(`[rivet-serverless] Listening for engine requests at ${siteUrl}/api/rivet`)
  console.log('[rivet-serverless] Engine pool must be SERVERLESS kind with URL:', `${siteUrl}/api/rivet`)
  console.log('[rivet-serverless] To verify: curl "https://rivet.yebi.africa/runners?namespace=komla" -H "Authorization: Bearer <TOKEN>" (should show NO runners)')
})
