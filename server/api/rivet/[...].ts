import { toWebRequest } from 'h3'
import { registry } from '~/server/rivet/registry'

/**
 * Catch-all route for Rivet Engine HTTP endpoints.
 *
 * The Rivet Engine (rivet.yebi.africa) calls:
 *   GET /api/rivet/metadata  — to discover the runner
 *   GET /api/rivet/start     — to start an actor on this runner
 *
 * We delegate all /api/rivet/* requests to registry.handler(),
 * which converts them into the RivetKit serverless flow.
 */
export default defineEventHandler(async (event) => {
  const webRequest = toWebRequest(event)
  return registry.handler(webRequest)
})
