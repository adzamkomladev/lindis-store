import { registry } from '~/server/rivet/registry'
import { connectDB } from '~/server/db/mongodb'

/**
 * Parse RIVET_ENDPOINT into API URL, namespace, and token.
 * Format: https://namespace:token@host
 */
function parseRivetEndpoint() {
  const endpoint = process.env.RIVET_ENDPOINT
  if (!endpoint) {
    console.error('[Rivet] RIVET_ENDPOINT is not set')
    return null
  }

  try {
    const url = new URL(endpoint)
    return {
      apiUrl: `${url.protocol}//${url.host}`,
      namespace: url.username || 'default',
      token: url.password || '',
    }
  } catch {
    console.error('[Rivet] Failed to parse RIVET_ENDPOINT:', endpoint)
    return null
  }
}

/**
 * Check and fix the engine's runner pool configuration.
 *
 * If the pool is configured as `serverless` kind (from a previous deployment),
 * the engine expects to call HTTP /api/rivet/start to wake actors. But in
 * runner mode (startEnvoy), the engine should route actor requests to the
 * connected envoy over WebSocket. A pool kind mismatch causes
 * `actor_runner_failed` errors.
 *
 * Returns true if the pool is (or was made) normal kind, false if unknown.
 */
async function ensureNormalRunnerPool(): Promise<boolean> {
  const parsed = parseRivetEndpoint()
  if (!parsed) return false

  const { apiUrl, namespace, token } = parsed
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  console.log(`[Rivet] Checking pool config — API: ${apiUrl}, namespace: ${namespace}`)

  try {
    // Check current pool configuration
    const configsRes = await $fetch<any>(
      `${apiUrl}/runner-configs?namespace=${namespace}&runner_name=default`,
      { headers: authHeader }
    )

    const configs = configsRes?.runner_configs || {}
    const defaultConfig = configs.default

    if (!defaultConfig) {
      console.log('[Rivet] No runner pool config found for "default" — engine will auto-detect connected envoy')
      return true
    }

    // Check if any datacenter is configured as serverless
    const datacenters = defaultConfig.datacenters || {}
    let hasServerless = false
    let hasPoolError = false
    const issues: string[] = []

    for (const [dcName, dcConfig] of Object.entries(datacenters) as [string, any][]) {
      if (dcConfig.serverless) {
        hasServerless = true
        issues.push(`datacenter "${dcName}" is SERVERLESS (URL: ${dcConfig.serverless.url})`)
      }
      if (dcConfig.runner_pool_error) {
        hasPoolError = true
        issues.push(`datacenter "${dcName}" has error: ${JSON.stringify(dcConfig.runner_pool_error)}`)
      }
    }

    // Healthy if normal kind with no pool error
    if (!hasServerless && !hasPoolError) {
      console.log('[Rivet] Runner pool is already configured as normal kind ✓')
      if (issues.length > 0) {
        console.warn('[Rivet] Pool issues found (non-fatal):', issues.join('; '))
      }
      return true
    }

    // If we have a pool error but no serverless, log it — the pool exists,
    // it just had a previous failed runner attempt. The auto-fix below will
    // re-assert the normal config and clear the error.
    if (!hasServerless && hasPoolError) {
      console.warn('[Rivet] ⚠ Pool has stored error from a previous failed attempt:', issues.join('; '))
      console.log('[Rivet] Re-asserting normal kind to clear stale error state...')
    }

    // Fix: switch to normal kind
    console.warn('[Rivet] ⚠ Pool is configured as SERVERLESS kind:', issues.join('; '))
    console.log('[Rivet] Fixing runner pool — switching to normal kind...')
    console.log(`[Rivet]   PUT ${apiUrl}/runner-configs/default?namespace=${namespace}`)

    try {
      const putRes = await $fetch(
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
      console.log('[Rivet]   PUT response:', JSON.stringify(putRes))
      console.log('[Rivet] Runner pool switched to normal kind ✓')
    } catch (putError: any) {
      console.error('[Rivet] ✗ PUT /runner-configs/default FAILED:')
      console.error('[Rivet]   status:', putError?.statusCode || putError?.status)
      console.error('[Rivet]   message:', putError?.message || putError)
      console.error('[Rivet]   data:', JSON.stringify(putError?.data || putError?.response?._data || null))
      console.error('[Rivet]   headers:', JSON.stringify(putError?.response?.headers || null))
      throw putError
    }

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
      console.log('[Rivet] Pool metadata refreshed ✓')
    } catch (refreshError) {
      console.warn('[Rivet] Failed to refresh metadata (non-critical):', (refreshError as Error).message)
    }

    return true
  } catch (error) {
    const errMsg = (error as Error).message
    console.error('[Rivet] Failed to check/fix runner pool config:', errMsg)

    // Provide actionable curl commands for manual fix
    console.error('[Rivet] ─── Manual fix ───')
    console.error(`[Rivet] curl -X PUT "${apiUrl}/runner-configs/default?namespace=${namespace}" \\`)
    console.error(`[Rivet]   -H "Authorization: Bearer ${token ? '<TOKEN>' : ''}" \\`)
    console.error('[Rivet]   -H "Content-Type: application/json" \\')
    console.error('[Rivet]   -d \'{"datacenters":{"default":{"normal":{}}}}\'')
    console.error('[Rivet] ──────────────')

    return false
  }
}

/**
 * Post-startup verification — checks if the runner is visible to the engine.
 * Runs after a delay to give the envoy time to connect.
 */
async function verifyRunnerConnected(): Promise<void> {
  const parsed = parseRivetEndpoint()
  if (!parsed) return

  const { apiUrl, namespace, token } = parsed
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {}

  try {
    // Check if any runners are connected
    const runnersRes = await $fetch<any>(
      `${apiUrl}/runners?namespace=${namespace}&name=default&include_stopped=false&limit=10`,
      { headers: authHeader }
    )

    const runners = runnersRes?.runners || []
    if (runners.length > 0) {
      console.log(`[Rivet] ✓ Runner verified — ${runners.length} runner(s) connected to engine`)
      for (const runner of runners) {
        console.log(`[Rivet]   Runner: ${runner.runner_id || runner.id}, last_ping: ${runner.last_ping_ts || 'unknown'}`)
      }
    } else {
      console.warn('[Rivet] ⚠ No runners visible to engine yet — envoy may still be connecting')
      console.warn('[Rivet]   Check: curl "' + apiUrl + '/runners?namespace=' + namespace + '&name=default" -H "Authorization: Bearer <TOKEN>"')
    }

    // Also check pool config again to confirm it's normal
    const configsRes = await $fetch<any>(
      `${apiUrl}/runner-configs?namespace=${namespace}&runner_name=default`,
      { headers: authHeader }
    )
    const configs = configsRes?.runner_configs || {}
    const dc = configs.default?.datacenters || {}
    for (const [dcName, dcConfig] of Object.entries(dc) as [string, any][]) {
      if (dcConfig.serverless) {
        console.error(`[Rivet] ✗ Pool STILL configured as serverless in datacenter "${dcName}" — actor_runner_failed will persist!`)
        console.error('[Rivet]   Run POST /api/admin/rivet-diagnostics to fix, or use the curl command from startup logs')
      }
    }
  } catch (error) {
    console.warn('[Rivet] Could not verify runner connection:', (error as Error).message)
  }
}

/**
 * Probe WebSocket reachability to the engine's /runners/connect endpoint.
 *
 * The envoy opens a WSS connection to {endpoint}/runners/connect. If anything
 * blocks this connection (firewall, DNS, TLS, auth, wrong path), the runner
 * never registers and every actor call returns `no_runners_available`. We
 * probe the same path with a short-timeout WS handshake so failures are
 * visible at startup instead of silently breaking actor routing later.
 *
 * Returns true if the WS handshake completes (or times out cleanly),
 * false on hard failure (DNS, TCP refused, TLS error, 4xx, etc).
 */
async function probeWebSocketReachability(): Promise<boolean> {
  const parsed = parseRivetEndpoint()
  if (!parsed) return false

  const { apiUrl, namespace, token } = parsed
  const wsBase = apiUrl.replace(/^http/, 'ws')
  const probeUrl = `${wsBase}/runners/connect?protocol_version=1&namespace=${encodeURIComponent(namespace)}&runner_key=__probe__`
  const protocols = token ? ['rivet', `rivet_token.${token}`] : ['rivet']

  console.log(`[Rivet]   Probing: ${wsBase}/runners/connect?protocol_version=1&namespace=${namespace}&runner_key=__probe__`)

  return new Promise<boolean>((resolve) => {
    let settled = false
    const finish = (ok: boolean, reason: string) => {
      if (settled) return
      settled = true
      console.log(`[Rivet]   Probe result: ${ok ? 'OK' : 'FAILED'} — ${reason}`)
      resolve(ok)
    }

    let ws: any
    try {
      // Try global WebSocket first (Bun, browsers), then fall back to ws package (Node).
      // The SDK imports its own WS module — we use whatever is available to us
      // at probe time. We don't need a real connection, just a successful
      // handshake (open event) or a clean close.
      const WS = (globalThis as any).WebSocket
      if (!WS) {
        finish(false, 'no WebSocket constructor available globally; skipping probe (Bun missing?)')
        return
      }
      ws = new WS(probeUrl, protocols)
    } catch (e) {
      finish(false, `constructor threw: ${(e as Error).message}`)
      return
    }

    const timeout = setTimeout(() => {
      try { ws?.close() } catch {}
      // Timeout on a probe is a *good* sign: it means TCP+TLS+WS-handshake
      // reached the engine. The engine then keeps the WS open waiting for
      // ToServerInit, which we never send. We treat that as "reachable".
      finish(true, 'no open event in 5s — assumed reachable (engine holding WS open)')
    }, 5000)

    try {
      ws.addEventListener('open', () => {
        clearTimeout(timeout)
        try { ws.close(1000, 'probe') } catch {}
        finish(true, 'WS handshake succeeded')
      })
      ws.addEventListener('error', (ev: any) => {
        clearTimeout(timeout)
        finish(false, `WS error event: ${ev?.message || ev?.toString?.() || 'unknown'}`)
      })
      ws.addEventListener('close', (ev: any) => {
        clearTimeout(timeout)
        // 4xx close codes mean the engine rejected the WS (auth, bad path).
        // 1xxx transport codes mean the network path is broken.
        if (ev?.code >= 4000 && ev?.code < 5000) {
          finish(false, `WS closed with code ${ev.code} (${ev.reason || 'no reason'})`)
        } else {
          // Clean close (1000, 1001, 1006) without open = likely DNS/TCP failure
          finish(false, `WS closed code=${ev?.code} reason=${ev?.reason || 'unknown'} (no open event)`)
        }
      })
    } catch (e) {
      clearTimeout(timeout)
      finish(false, `addEventListener threw: ${(e as Error).message}`)
    }
  })
}

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
 * On startup, this plugin:
 * 1. Waits for MongoDB to be ready (actors need DB access in onCreate)
 * 2. Checks and fixes the engine's runner pool config (serverless → normal)
 * 2.5 Probes WebSocket reachability to engine (catches network/TLS/auth issues)
 * 3. Starts the envoy WebSocket connection
 * 4. After 15s delay, verifies the runner is visible to the engine
 *
 * @see https://rivet.dev/docs/general/runtime-modes#runners
 * @see https://rivet.dev/docs/actors/debugging
 */
export default defineNitroPlugin(async () => {
  console.log('[Rivet] ═══ Runner plugin initializing ═══')

  // Step 1: Wait for MongoDB to be ready
  try {
    await connectDB()
    console.log('[Rivet] Step 1/4: MongoDB ready ✓')
  } catch (error) {
    console.error('[Rivet] Step 1/4: MongoDB not ready, retrying in 5s:', (error as Error).message)
    await new Promise(resolve => setTimeout(resolve, 5000))
    try {
      await connectDB()
      console.log('[Rivet] Step 1/4: MongoDB connected on retry ✓')
    } catch (retryError) {
      console.error('[Rivet] Step 1/4: MongoDB still not ready:', (retryError as Error).message)
    }
  }

  // Step 2: Ensure engine pool is configured as normal (not serverless)
  console.log('[Rivet] Step 2/4: Checking runner pool configuration...')
  const poolOk = await ensureNormalRunnerPool()
  if (!poolOk) {
    console.warn('[Rivet] Step 2/4: Pool config check failed — will retry after envoy starts')
  }

  // Step 2.5: Verify WebSocket reachability to engine before starting envoy
  // The runner envoy opens a WS to {endpoint}/runners/connect — if that fails
  // (firewall, DNS, TLS, auth), startEnvoy() returns successfully but the
  // runner never registers and every actor call gets `no_runners_available`.
  console.log('[Rivet] Step 2.5/4: Probing WebSocket reachability to engine...')
  const wsReachable = await probeWebSocketReachability()
  if (!wsReachable) {
    console.error('[Rivet] Step 2.5/4: ✗ WebSocket probe FAILED — runner registration will not work.')
    console.error('[Rivet]   This usually means:')
    console.error('[Rivet]     - Firewall blocking outbound WSS from VPS to rivet.yebi.africa:443')
    console.error('[Rivet]     - DNS cannot resolve rivet.yebi.africa')
    console.error('[Rivet]     - TLS handshake failing (cert mismatch, SNI issue)')
    console.error('[Rivet]     - RIVET_ENDPOINT token is invalid (401 on WS upgrade)')
    console.error('[Rivet]   Continuing anyway — startEnvoy() will retry in background.')
  } else {
    console.log('[Rivet] Step 2.5/4: Engine WebSocket reachable ✓')
  }

  // Step 3: Start the envoy
  try {
    const endpoint = process.env.RIVET_ENDPOINT?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')
    const version = process.env.RIVET_RUNNER_VERSION || '1'
    console.log(`[Rivet] Step 3/4: Starting envoy — endpoint: ${endpoint}, version: ${version}`)
    registry.startEnvoy()
    console.log('[Rivet] Step 3/4: Envoy started ✓')
  } catch (error) {
    console.error('[Rivet] Step 3/4: Failed to start envoy:', (error as Error).message)
    console.error('[Rivet] Stack:', (error as Error).stack)
    // Don't throw — let Nitro start so the storefront can serve static
    // pages and health checks while the SDK retries the connection.
  }

  // Step 4: Post-startup verification (delayed to give envoy time to connect)
  const VERIFY_DELAY_MS = 15_000
  console.log(`[Rivet] Step 4/4: Scheduling runner verification in ${VERIFY_DELAY_MS / 1000}s...`)
  setTimeout(async () => {
    console.log('[Rivet] ═══ Post-startup verification ═══')

    // Re-check pool config (in case the first check ran before the engine had the pool)
    if (!poolOk) {
      console.log('[Rivet] Retrying pool config check...')
      await ensureNormalRunnerPool()
    }

    // Verify the runner is visible to the engine
    await verifyRunnerConnected()
    console.log('[Rivet] ═══ Verification complete ═══')
  }, VERIFY_DELAY_MS)
})
