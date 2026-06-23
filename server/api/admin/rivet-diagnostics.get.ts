/**
 * GET /api/admin/rivet-diagnostics — inspect Rivet Engine runner pool config,
 * connected runners, actors, and diagnose `actor_runner_failed` issues.
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

function diagnose(configs: any, runners: any[]): string {
  if (!configs || !configs.default) {
    return 'No runner pool configuration found for "default" pool. The engine may not have a pool configured.'
  }

  const dc = configs.default.datacenters || {}
  if (Object.keys(dc).length === 0) {
    return 'Runner pool exists but has no datacenter configurations.'
  }

  for (const [dcName, dcConfig] of Object.entries(dc) as [string, any][]) {
    if (dcConfig.serverless) {
      return `ISSUE FOUND: Datacenter "${dcName}" is configured as SERVERLESS kind ` +
        `(URL: ${dcConfig.serverless.url}). The engine expects to call HTTP /api/rivet/start ` +
        `to wake actors, but the app is running as a NORMAL runner via startEnvoy(). ` +
        `Use POST /api/admin/rivet-diagnostics to fix, or run the curl command manually.`
    }
    if (dcConfig.runner_pool_error) {
      return `ISSUE FOUND: Datacenter "${dcName}" has runner_pool_error: ${JSON.stringify(dcConfig.runner_pool_error)}`
    }
    if (dcConfig.normal) {
      const runnerCount = runners?.length || 0
      if (runnerCount === 0) {
        return 'Pool is NORMAL kind (correct), but no runners connected. Check startEnvoy() and WebSocket connection.'
      }
      return `Pool is NORMAL kind with ${runnerCount} connected runner(s). Configuration looks correct.`
    }
  }

  return 'Unable to determine pool kind. Check runner-configs response manually.'
}

export default defineEventHandler(async () => {
  const { apiUrl, namespace, token } = parseRivetEndpoint()
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {}

  try {
    const [namesRes, configsRes, runnersRes, actorsRes] = await Promise.all([
      $fetch<any>(`${apiUrl}/runners/names?namespace=${namespace}`, { headers: authHeader }),
      $fetch<any>(`${apiUrl}/runner-configs?namespace=${namespace}&runner_name=default`, { headers: authHeader }),
      $fetch<any>(`${apiUrl}/runners?namespace=${namespace}&name=default&include_stopped=true&limit=10`, { headers: authHeader }),
      $fetch<any>(`${apiUrl}/actors?namespace=${namespace}`, { headers: authHeader }),
    ])

    return {
      status: 'ok',
      poolNames: namesRes?.names || [],
      runnerConfigs: configsRes?.runner_configs || {},
      connectedRunners: runnersRes?.runners || [],
      actors: (actorsRes?.actors || []).map((a: any) => ({
        actor_id: a.actor_id,
        name: a.name,
        key: a.key,
        create_ts: a.create_ts,
      })),
      diagnosis: diagnose(configsRes?.runner_configs, runnersRes?.runners),
    }
  } catch (error: any) {
    return {
      status: 'error',
      message: error.message || 'Failed to fetch diagnostics',
      details: error.data || error.toString(),
    }
  }
})
