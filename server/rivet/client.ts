import { createClient } from 'rivetkit/client'
import { registry } from './registry'

/**
 * Create a Rivet client for use in Nuxt API routes.
 *
 * Important: this must be a runtime import, not `import type`, so the
 * registry module is evaluated and the serverless handler is registered.
 *
 * createClient() automatically reads RIVET_ENDPOINT from env.
 * Defaults to http://localhost:6420 in development.
 * Production: connects to self-hosted engine at rivet.yebi.africa
 *
 * Usage in API routes:
 *   const rivet = useRivet()
 *   const product = await rivet.catalogActor.getOrCreate(['main']).getProduct('my-blender')
 */
export function useRivet() {
  return createClient<typeof registry>({
    endpoint: process.env.RIVET_ENDPOINT,
  })
}

export function isRivetRunnerUnavailable(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const msg = error.message
  return (
    /No runners with name .* are available/i.test(msg) ||
    /runner_pool_error/i.test(msg) ||
    /ActorSchedulingError/i.test(msg) ||
    /actor_runner_failed/i.test(msg)
  )
}
