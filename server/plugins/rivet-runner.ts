import { registry } from '~/server/rivet/registry'

/**
 * Nitro plugin — starts the RivetKit envoy on server startup.
 *
 * The envoy opens a persistent WebSocket to the Rivet Engine
 * (rivet.yebi.africa) and registers this process as a runner.
 * The engine then routes actor calls to this long-lived process,
 * keeping all 9 actors (catalog, inventory, cart, order, workers,
 * analytics, settings) resident in memory.
 *
 * This is RUNNER mode — the correct mode for a VPS deployment with
 * in-memory stateful actors. The engine pushes work to the runner
 * over the envoy WebSocket, rather than pulling via HTTP /api/rivet/start
 * (serverless mode, which recreates actors per request).
 *
 * registry.startEnvoy() is fire-and-forget: it stores the serve promise
 * internally and the SDK auto-retries on disconnect. We do NOT await it
 * so Nitro startup is not blocked.
 *
 * Requirements:
 * - RIVET_ENDPOINT must resolve with a valid token (URL-auth or RIVET_TOKEN).
 * - The reverse proxy fronting the engine must forward Sec-WebSocket-Protocol
 *   unchanged on the WebSocket upgrade — the guard authenticates via the
 *   rivet_token.<token> sub-protocol; stripping it causes guard.missing_header.
 * - RIVET_RUNNER_VERSION should be bumped on each deploy so the engine
 *   drains stale envoys.
 *
 * @see https://rivet.dev/docs/general/runtime-modes#runners
 */
export default defineNitroPlugin(() => {
  try {
    registry.startEnvoy()
    console.log('[Rivet] Envoy starting — registering as runner with Rivet Engine')
  } catch (error) {
    console.error('[Rivet] Failed to start envoy:', (error as Error).message)
    // Don't throw — let Nitro start so the storefront can serve static
    // pages and health checks while the SDK retries the connection.
  }
})
