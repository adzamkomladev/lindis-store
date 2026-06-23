import { registry } from '~/server/rivet/registry'
import { connectDB } from '~/server/db/mongodb'
import tls from 'node:tls'
import net from 'node:net'

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
      host: url.host,
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
    console.log('[Rivet]   GET runner-configs...')
    const getStart = Date.now()
    const configsRes = await $fetch<any>(
      `${apiUrl}/runner-configs?namespace=${namespace}&runner_name=default`,
      { headers: authHeader, timeout: 10_000 }
    )
    console.log(`[Rivet]   GET completed in ${Date.now() - getStart}ms`)

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
      console.log('[Rivet]   PUT: sending request...')
      const putStart = Date.now()
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
          timeout: 10_000, // fail fast — engine should respond in <1s
        }
      )
      console.log(`[Rivet]   PUT: completed in ${Date.now() - putStart}ms`)
      console.log('[Rivet]   PUT response:', JSON.stringify(putRes))
      console.log('[Rivet] Runner pool switched to normal kind ✓')
    } catch (putError: any) {
      console.error('[Rivet] ✗ PUT /runner-configs/default FAILED:')
      console.error('[Rivet]   status:', putError?.statusCode || putError?.status)
      console.error('[Rivet]   message:', putError?.message || putError)
      console.error('[Rivet]   data:', JSON.stringify(putError?.data || putError?.response?._data || null))
      console.error('[Rivet]   headers:', JSON.stringify(putError?.response?.headers || null))
      // Don't re-throw — log and continue. Returning false tells the main
      // plugin to keep going and start the envoy anyway; the engine will
      // create the pool config when the first runner connects, regardless
      // of whether our PUT succeeded.
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
 * Probe TCP + TLS connectivity to the engine host.
 *
 * This is a simple TCP socket connect to host:443 — no HTTP, no WebSocket,
 * no dependencies. If the TCP handshake completes, the VPS can reach the
 * engine at the network level. If it fails (EHOSTUNREACH, ETIMEDOUT, etc.),
 * the VPS has a firewall, DNS, or routing issue preventing ANY connection
 * to the engine — which would explain "no runners available" even though
 * the pool is correctly configured.
 *
 * Returns true if TCP connect succeeds, false on any error.
 */
function probeTcpReachability(host: string, port: number = 443): Promise<{ ok: boolean; reason: string }> {
  return new Promise((resolve) => {
    const start = Date.now()
    const socket = new net.Socket()
    socket.setTimeout(5000)
    socket.on('connect', () => {
      const ms = Date.now() - start
      socket.destroy()
      resolve({ ok: true, reason: `TCP connected in ${ms}ms` })
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve({ ok: false, reason: `TCP timeout after 5s (firewall dropping packets?)` })
    })
    socket.on('error', (err: NodeJS.ErrnoException) => {
      socket.destroy()
      resolve({ ok: false, reason: `TCP error: ${err.code || err.message}` })
    })
    socket.connect(port, host)
  })
}

/**
 * Probe WebSocket upgrade reachability to the engine's /runners/connect endpoint.
 *
 * Uses Node.js built-in tls.connect + raw HTTP upgrade headers. No WebSocket
 * library or globalThis.WebSocket required — works in any Node.js runtime
 * (Node 18+, Bun, etc.).
 *
 * The engine's /runners/connect endpoint expects a standard WebSocket upgrade
 * with the `rivet_token.<token>` subprotocol. We send the HTTP upgrade request,
 * read the first response line, and immediately close the socket.
 *
 * Returns true if the engine responds with 101 Switching Protocols,
 * false on any error (4xx, connection refused, TLS error, timeout).
 */
function probeWebSocketReachability(
  host: string,
  port: number,
  namespace: string,
  token: string
): Promise<{ ok: boolean; reason: string }> {
  return new Promise((resolve) => {
    let settled = false
    const finish = (ok: boolean, reason: string) => {
      if (settled) return
      settled = true
      try { socket.destroy() } catch {}
      clearTimeout(timeout)
      resolve({ ok, reason })
    }

    const timeout = setTimeout(() => finish(false, 'timeout after 8s'), 8000)

    let socket: net.Socket
    try {
      socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false })
    } catch (e: any) {
      finish(false, `tls.connect threw: ${e.message}`)
      return
    }

    const protocols = token ? `rivet, rivet_token.${token}` : 'rivet'
    const key = Buffer.from(Math.random().toString()).toString('base64')
    const path = `/runners/connect?protocol_version=1&namespace=${encodeURIComponent(namespace)}&runner_key=__health_probe__`
    const request = [
      `GET ${path} HTTP/1.1`,
      `Host: ${host}`,
      'Connection: Upgrade',
      'Upgrade: websocket',
      `Sec-WebSocket-Version: 13`,
      `Sec-WebSocket-Key: ${key}`,
      `Sec-WebSocket-Protocol: ${protocols}`,
      '',
      '',
    ].join('\r\n')

    let data = ''
    socket.on('connect', () => socket.write(request))
    socket.on('data', (chunk: Buffer) => {
      data += chunk.toString()
      // Read just the first line: "HTTP/1.1 101 Switching Protocols"
      const firstLine = data.split('\r\n')[0] || ''
      if (firstLine.startsWith('HTTP/1.1 101')) {
        finish(true, 'WS upgrade accepted (101)')
      } else if (firstLine.includes('HTTP/') && !firstLine.includes('101')) {
        const status = firstLine.split(' ').slice(0, 3).join(' ')
        finish(false, `WS upgrade rejected: ${status}`)
      }
      // If we haven't seen a complete response line yet, keep waiting
    })
    socket.on('error', (err: NodeJS.ErrnoException) => {
      finish(false, `TLS/WS error: ${err.code || err.message}`)
    })
    socket.on('end', () => {
      // If we got here without settling, the engine accepted but closed early
      if (!settled) {
        const firstLine = data.split('\r\n')[0] || ''
        if (firstLine.startsWith('HTTP/1.1 101')) {
          finish(true, 'WS upgrade accepted (engine closed after handshake)')
        } else {
          finish(false, `connection closed before response: ${firstLine || 'no data'}`)
        }
      }
    })
    socket.on('close', () => {
      if (!settled) {
        finish(false, 'connection closed without response')
      }
    })
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
  const pluginStart = Date.now()
  const t = () => `[+${Date.now() - pluginStart}ms]`
  console.log(`[Rivet] ${t()} ═══ Runner plugin initializing ═══`)
  console.log(`[Rivet] ${t()} RIVET_ENDPOINT=${process.env.RIVET_ENDPOINT ? '***set***' : 'MISSING'}`)
  console.log(`[Rivet] ${t()} RIVET_RUNNER_VERSION=${process.env.RIVET_RUNNER_VERSION || 'unset'}`)

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

  // Step 2.5: Verify network + WebSocket reachability before starting envoy.
  // The runner envoy opens a WS to wss://host/runners/connect — if that fails
  // (firewall, DNS, TLS, auth, wrong path), startEnvoy() returns successfully
  // but the runner never registers and every actor call gets no_runners_available.
  //
  // We do TWO probes:
  //   a) TCP connect to host:443 — validates basic network path
  //   b) WebSocket upgrade request — validates the engine accepts runner WS connections
  console.log('[Rivet] Step 2.5/4: Probing engine connectivity...')

  const parsedEp = parseRivetEndpoint()
  if (parsedEp) {
    // a) TCP connectivity
    console.log(`[Rivet]   TCP probe: connecting to ${parsedEp.host}:443...`)
    const tcpResult = await probeTcpReachability(parsedEp.host, 443)
    console.log(`[Rivet]   TCP result: ${tcpResult.ok ? 'OK' : 'FAILED'} — ${tcpResult.reason}`)

    if (!tcpResult.ok) {
      console.error('[Rivet] ─── NETWORK DIAGNOSIS ───')
      console.error(`[Rivet]   The VPS cannot establish a TCP connection to ${parsedEp.host}:443.`)
      console.error('[Rivet]   This means the engine is UNREACHABLE from this VPS.')
      console.error('[Rivet]   Possible causes:')
      console.error('[Rivet]     - VPS firewall blocking outbound port 443')
      console.error(`[Rivet]     - DNS cannot resolve ${parsedEp.host}`)
      console.error('[Rivet]     - Network routing issue on the VPS')
      console.error('[Rivet]     - Docker network not allowing outbound connections')
      console.error('[Rivet]   Fix: SSH into VPS and run:')
      console.error(`[Rivet]     curl -v https://${parsedEp.host}/`)
      console.error(`[Rivet]     nc -zv ${parsedEp.host} 443`)
      console.error('[Rivet] ──────────────────────────')
    } else {
      // b) WebSocket upgrade probe (only if TCP works)
      console.log('[Rivet]   WS probe: sending upgrade request to /runners/connect...')
      const wsResult = await probeWebSocketReachability(
        parsedEp.host,
        443,
        parsedEp.namespace,
        parsedEp.token
      )
      console.log(`[Rivet]   WS result: ${wsResult.ok ? 'OK' : 'FAILED'} — ${wsResult.reason}`)

      if (!wsResult.ok) {
        console.error('[Rivet] ─── WEBSOCKET DIAGNOSIS ───')
        console.error('[Rivet]   TCP is OK but the WebSocket upgrade was REJECTED.')
        console.error(`[Rivet]   The engine responded: ${wsResult.reason}`)
        console.error('[Rivet]   Possible causes:')
        console.error('[Rivet]     - Wrong auth token (check RIVET_ENDPOINT password)')
        console.error('[Rivet]     - Namespace mismatch')
        console.error('[Rivet]     - Engine version incompatibility')
        console.error('[Rivet]     - Engine /runners/connect endpoint not available')
        console.error('[Rivet]   Fix: verify the Engine dashboard Connect tab shows')
        console.error('[Rivet]     the correct namespace and token. The WS subprotocol')
        console.error('[Rivet]     should be "rivet_token.<token>" (from RIVET_ENDPOINT URL password).')
        console.error('[Rivet] ──────────────────────────────')
      }
    }
  } else {
    console.error('[Rivet] Step 2.5/4: Cannot probe — RIVET_ENDPOINT not parseable')
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
