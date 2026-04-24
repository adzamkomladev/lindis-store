import { registry } from '~/server/rivet/registry'

/**
 * Nitro plugin — starts the RivetKit runner on server boot.
 *
 * This opens a persistent connection to the Rivet Engine so that
 * actors can be scheduled on this server. Must run after MongoDB
 * is connected (mongodb.ts plugin) so that actor onCreate hooks
 * can query the database.
 */
export default defineNitroPlugin(async () => {
  try {
    registry.startRunner()
    console.log('[Rivet] Runner started and connecting to engine...')
  } catch (error) {
    console.error('[Rivet] Failed to start runner:', (error as Error).message)
    // Do not throw — let the server start so HTTP requests can still be served
    // (public routes have MongoDB fallbacks)
  }
})
