/**
 * RivetKit Runner Plugin — Minimal
 *
 * Starts the RivetKit envoy at Nitro startup. The envoy opens a persistent
 * WebSocket to the Rivet Engine (rivet.yebi.africa) and registers this
 * process as a runner. The engine then routes actor calls to this process.
 *
 * This is RUNNER mode — correct for a VPS deployment with in-memory actors.
 *
 * This file is intentionally minimal to avoid Nitro/Railpack cache issues.
 * All diagnostic logic is done by the engine itself via the /runners API.
 */

import { registry } from '~/server/rivet/registry'
import { connectDB } from '~/server/db/mongodb'

export default defineNitroPlugin(async () => {
  // 1. Connect MongoDB
  try {
    await connectDB()
  } catch (e) {
    // Will retry internally; don't block startup
    console.warn('[rivet-runner] MongoDB initial connect failed, retrying...')
  }

  // 2. Parse endpoint for diagnostics
  const ep = process.env.RIVET_ENDPOINT || ''
  const epParsed = (() => {
    try {
      const u = new URL(ep)
      return { host: u.host, namespace: u.username || 'default', hasToken: !!u.password, token: u.password || '' }
    } catch { return null }
  })()

  console.log(
    '[rivet-runner] Starting envoy to', epParsed?.host || 'unknown',
    'ns:', epParsed?.namespace || '?',
    'auth:', epParsed?.hasToken ? 'yes' : 'NO'
  )

  // 3. Start the envoy
  try {
    registry.startEnvoy()
    console.log('[rivet-runner] Envoy started OK')
  } catch (e: any) {
    console.error('[rivet-runner] Envoy failed:', e?.message || e)
    return
  }

  // 4. Log verify command
  if (epParsed) {
    console.log(
      '[rivet-runner] Verify: curl',
      `"${epParsed.host}/runners?namespace=${epParsed.namespace}&name=default"`,
      '-H "Authorization: Bearer <TOKEN>"'
    )
  }

  // 5. After 15s, check if runner is visible
  setTimeout(async () => {
    if (!epParsed) return
    try {
      const res = await $fetch<any>(
        `https://${epParsed.host}/runners?namespace=${epParsed.namespace}&name=default&include_stopped=false&limit=5`,
        {
          headers: epParsed.token ? { Authorization: `Bearer ${epParsed.token}` } : {},
          timeout: 10_000,
        }
      )
      const runners = res?.runners || []
      if (runners.length > 0) {
        console.log(`[rivet-runner] ${runners.length} runner(s) visible — OK`)
      } else {
        console.warn('[rivet-runner] No runners visible! Envoy may have failed to connect.')
        console.warn(
          '[rivet-runner] Verify manually: curl',
          `"https://${epParsed.host}/runners?namespace=${epParsed.namespace}&name=default"`,
          '-H "Authorization: Bearer <TOKEN>"'
        )
      }
    } catch (e: any) {
      console.warn('[rivet-runner] Verify check failed:', e?.message || e)
    }
  }, 15_000)
})
