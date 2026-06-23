/**
 * POST /api/admin/rivet-diagnostics — fix runner pool configuration.
 * Switches the engine's runner pool from `serverless` to `normal` kind.
 *
 * Protected by server/middleware/admin.ts (checks session.user.role === 'admin').
 */

function parseRivetEndpoint() {
  const endpoint = process.env.RIVET_ENDPOINT
  if (!endpoint) throw createError({ statusCode: 500, message: 'RIVET_ENDPOINT not set' })

  const url = new URL(endpoint)
  return {
    apiUrl: `${url.protocol}//${url.host}`,
    namespace: url.username || 'default',
    token: url.password || '',
  }
}

export default defineEventHandler(async () => {
  const { apiUrl, namespace, token } = parseRivetEndpoint()
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  try {
    // Switch pool to normal kind
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
      message: 'Runner pool switched to normal kind. The engine should now route actor requests to the connected envoy. Wait ~10s and check logs.',
      fixResult,
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: `Failed to fix pool config: ${error.message || error.toString()}`,
      details: error.data || null,
      suggestion: `Try running this curl command on the VPS:\n` +
        `curl -X PUT "${apiUrl}/runner-configs/default?namespace=${namespace}" \\\n` +
        `  -H "Authorization: Bearer <TOKEN>" \\\n` +
        `  -H "Content-Type: application/json" \\\n` +
        `  -d '{"datacenters":{"default":{"normal":{}}}}'`,
    }
  }
})
