import { createClient } from 'rivetkit/client'
import { registry } from './registry'

/**
 * Create a Rivet client for use in Nuxt API routes.
 *
 * Important: this must be a runtime import, not `import type`, so the
 * registry module is evaluated and `registry.startRunner()` registers the runner.
 *
 * createClient() automatically reads RIVET_ENDPOINT from env.
 * Defaults to http://localhost:6420 in development.
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

export function isRivetRunnerUnavailable(error: unknown) {
  return error instanceof Error && /No runners with name .* are available/i.test(error.message)
}
