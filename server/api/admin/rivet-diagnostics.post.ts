import { getUserSession } from '#auth-utils'

/**
 * POST /api/admin/rivet-diagnostics — fix runner pool configuration.
 * Switches the engine's runner pool from `serverless` to `normal` kind.
 *
 * The `actor_runner_failed` error typically means the engine's pool is
 * configured as `serverless` kind (from a previous deployment mode), but
 * the app is now running as a `normal` runner via `startEnvoy()`.
 *
 * This endpoint requires admin auth.
 */

function parseRivetEndpoint() {
  const endpoint = process.env.RIVET_ENDPOINT
  if (!endpoint) throw createError({ statusCode: 500, message: 'RIVET_ENDPOINT not set' })

  const url = new URL(endpoint)
  const namespace = url.username || 'default'
  const token = url.password || ''
  const apiUrl = `${url.protocol}//${url.host}`

  return { apiUrl, namespace, token }
}

export default defineEventHandler(async (event) => {
  // Admin auth check
  const session = await getUserSession(event)
  if (session.user?.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Admin access required' })
  }

  const { apiUrl, namespace, token } = parseRivetEndpoint()
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  try {
    // Fix runner pool configuration — switch to normal kind
    const fixResult = await $fetch<any>(
      `${apiUrl}/runner-configs/default?namespace=${namespace}`,
      {
        method: 'PUT',
        headers: { ...authHeader, 'Content-Type': 'application/json' },
        body: {
          datacenters: {
            default: {
              normal: {},
            },
          },
        },
      }
    )

    // Refresh metadata so the engine picks up the new config
    try {
      await $fetch(
        `${apiUrl}/runner-configs/default/refresh-metadata?namespace=${namespace}`,
        {
          method: 'POST',
          headers: { ...authHeader, 'Content-Type': 'application/json' },
          body: {},
        }
      )
    } catch {
      // Refresh might not be available — not critical
    }

    return {
      status: 'fixed',
      message: 'Runner pool switched to normal kind. The engine should now route actor requests to the connected envoy. Wait ~10 seconds and check the logs.',
      fixResult,
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: `Failed to fix pool config: ${error.message || error.toString()}`,
      details: error.data || null,
      suggestion: `Try running this curl command on the VPS instead:\n` +
        `curl -X PUT "${apiUrl}/runner-configs/default?namespace=${namespace}" \\\n` +
        `  -H "Authorization: Bearer ${token ? '<YOUR_TOKEN>' : ''}" \\\n` +
        `  -H "Content-Type: application/json" \\\n` +
        `  -d '{"datacenters":{"default":{"normal":{}}}}'`,
    }
  }
})
