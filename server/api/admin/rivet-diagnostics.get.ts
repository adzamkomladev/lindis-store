import { getUserSession } from '#auth-utils'

/**
 * Diagnostic endpoint — inspects and optionally fixes the Rivet Engine's
 * runner pool configuration.
 *
 * The `actor_runner_failed` error typically means the engine's pool is
 * configured as `serverless` kind (from a previous deployment mode), but
 * the app is now running as a `normal` runner via `startEnvoy()`.
 *
 * GET  /api/admin/rivet-diagnostics        — inspect current pool config
 * POST /api/admin/rivet-diagnostics         — fix pool config (switch to normal)
 *
 * This endpoint requires admin auth.
 */

// Parse RIVET_ENDPOINT into API URL, namespace, and token
function parseRivetEndpoint() {
  const endpoint = process.env.RIVET_ENDPOINT
  if (!endpoint) throw createError({ statusCode: 500, message: 'RIVET_ENDPOINT not set' })

  // Format: https://namespace:token@host
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
  const method = event.method

  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  if (method === 'GET') {
    // Inspect runner pool configuration
    try {
      // Get runner pool names
      const namesRes = await $fetch<{ names: string[] }>(
        `${apiUrl}/runners/names?namespace=${namespace}`,
        { headers: authHeader }
      )

      // Get runner configs (includes pool kind and errors)
      const configsRes = await $fetch<any>(
        `${apiUrl}/runner-configs?namespace=${namespace}&runner_name=default`,
        { headers: authHeader }
      )

      // Get connected runners
      const runnersRes = await $fetch<any>(
        `${apiUrl}/runners?namespace=${namespace}&name=default&include_stopped=false&limit=10`,
        { headers: authHeader }
      )

      // Get actors to see which ones are failing
      const actorsRes = await $fetch<any>(
        `${apiUrl}/actors?namespace=${namespace}`,
        { headers: authHeader }
      )

      return {
        status: 'ok',
        poolNames: namesRes.names || [],
        runnerConfigs: configsRes.runner_configs || {},
        connectedRunners: runnersRes.runners || [],
        actors: (actorsRes.actors || []).map((a: any) => ({
          actor_id: a.actor_id,
          name: a.name,
          key: a.key,
          create_ts: a.create_ts,
        })),
        diagnosis: diagnose(configsRes.runner_configs, runnersRes.runners),
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: error.message || 'Failed to fetch diagnostics',
        details: error.data || error.toString(),
      }
    }
  }

  if (method === 'POST') {
    // Fix runner pool configuration — switch to normal kind
    try {
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
        message: 'Runner pool switched to normal kind. The engine should now route actor requests to the connected envoy.',
        fixResult,
      }
    } catch (error: any) {
      return {
        status: 'error',
        message: `Failed to fix pool config: ${error.message || error.toString()}`,
        details: error.data || null,
        suggestion: 'Try running this curl command on the VPS instead:\n' +
          `curl -X PUT "${apiUrl}/runner-configs/default?namespace=${namespace}" \\\n` +
          `  -H "Authorization: Bearer ${token ? '***' : ''}" \\\n` +
          '  -H "Content-Type: application/json" \\\n' +
          '  -d \'{"datacenters":{"default":{"normal":{}}}}\'',
      }
    }
  }

  throw createError({ statusCode: 405, message: 'Method not allowed. Use GET to inspect or POST to fix.' })
})

function diagnose(configs: any, runners: any[]): string {
  if (!configs || !configs.default) {
    return 'No runner pool configuration found for "default" pool. The engine may not have a pool configured.'
  }

  const dc = configs.default.datacenters || {}
  const dcKeys = Object.keys(dc)

  if (dcKeys.length === 0) {
    return 'Runner pool exists but has no datacenter configurations.'
  }

  for (const [dcName, dcConfig] of Object.entries(dc) as [string, any][]) {
    if (dcConfig.serverless) {
      return `ISSUE FOUND: Datacenter "${dcName}" is configured as SERVERLESS kind ` +
        `(URL: ${dcConfig.serverless.url}). The engine expects to call HTTP /api/rivet/start ` +
        `to wake actors, but the app is running as a NORMAL runner via startEnvoy(). ` +
        `POST to this endpoint to fix it, or run the curl command manually.`
    }

    if (dcConfig.runner_pool_error) {
      return `ISSUE FOUND: Datacenter "${dcName}" has runner_pool_error: ${JSON.stringify(dcConfig.runner_pool_error)}`
    }

    if (dcConfig.normal) {
      const runnerCount = runners?.length || 0
      if (runnerCount === 0) {
        return `Pool is configured as NORMAL kind (correct!), but no runners are connected. ` +
          `Check that startEnvoy() is running and the WebSocket connection to the engine is alive.`
      }
      return `Pool is configured as NORMAL kind with ${runnerCount} connected runner(s). Configuration looks correct.`
    }
  }

  return 'Unable to determine pool kind. Check runner-configs response manually.'
}
