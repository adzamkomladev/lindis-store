import { toWebRequest } from 'h3'
import { registry } from '~/server/rivet/registry'

/**
 * Catch-all route for Rivet Engine HTTP endpoints.
 *
 * In RUNNER mode (the active mode for this VPS deployment), the engine
 * primarily routes actor calls over the envoy WebSocket started by
 * server/plugins/rivet-runner.ts. This handler still serves:
 *   GET /api/rivet/metadata  — engine discovers the runner's actors
 *   POST /api/rivet/start    — fallback for serverless-style starts
 *
 * We delegate all /api/rivet/* requests to registry.handler(),
 * which converts them into the RivetKit serverless flow. This coexists
 * with the envoy — handler() is a stateless request processor, not a
 * listener, so it does not conflict with Nitro's HTTP server.
 */
export default defineEventHandler(async (event) => {
  const webRequest = toWebRequest(event)
  return registry.handler(webRequest)
})
