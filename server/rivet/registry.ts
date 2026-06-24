import { setup } from 'rivetkit'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { resolve as resolvePath } from 'node:path'
import { catalogActor } from './actors/catalog-actor'
import { inventoryActor } from './actors/inventory-actor'
import { cartActor } from './actors/cart-actor'
import { orderActor } from './actors/order-actor'
import { paymentWorker } from './actors/payment-worker'
import { emailWorker } from './actors/email-worker'
import { reviewWorker } from './actors/review-worker'
import { analyticsActor } from './actors/analytics-actor'
import { settingsActor } from './actors/settings-actor'

/**
 * We always connect to an existing Rivet Engine endpoint (serverless), never
 * spawn a local engine binary. RivetKit's buildServeConfig() auto-discovers
 * the @rivetkit/engine-cli binary and adds it to the serve config as
 * `engineBinaryPath`. The WASM runtime then rejects that field because it
 * cannot spawn a binary. Pointing RIVET_ENGINE_BINARY at a non-existent path
 * makes engine-cli throw, so buildServeConfig() skips the field.
 */
if (!process.env.RIVET_ENGINE_BINARY) {
  process.env.RIVET_ENGINE_BINARY = '/dev/null/rivet-engine-binary-disabled'
}

/**
 * Provide the WASM runtime binary bytes directly so RivetKit never tries to
 * `fetch()` the .wasm file from a file:// or bundled import.meta.url.
 * Bun on Windows cannot load the optional @rivetkit/rivetkit-napi binary, so
 * it falls back to WASM. Passing initInput avoids the brittle fetch step both
 * in `bun run dev` and in the built node-server output.
 */
function getWasmInitInput(): Uint8Array | undefined {
  const candidates: string[] = []

  try {
    // Dev / unbundled: import.meta.url points at this file.
    const require = createRequire(import.meta.url)
    candidates.push(require.resolve('@rivetkit/rivetkit-wasm/rivetkit_wasm_bg.wasm'))
  } catch { }

  try {
    // Production bundle: import.meta.url is rewritten to file:///_entry.js,
    // so use the Node entry script (e.g. .output/server/index.mjs) instead.
    const entry = process.argv[1]
    if (entry) {
      const require = createRequire(pathToFileURL(resolvePath(entry)).href)
      candidates.push(require.resolve('@rivetkit/rivetkit-wasm/rivetkit_wasm_bg.wasm'))
    }
  } catch { }

  for (const wasmPath of candidates) {
    try {
      return readFileSync(wasmPath)
    } catch (err) {
      console.warn('[rivet-registry] Failed to read WASM from', wasmPath, (err as Error).message)
    }
  }

  console.warn('[rivet-registry] Could not preload WASM runtime, will let RivetKit fetch it')
  return undefined
}

// RivetKit's EnvoyConfigSchema default for `version` reads RIVET_ENVOY_VERSION.
// If we leave it unset, the default falls back to 1. We intentionally do NOT
// set it to "serverless" here because that string is not a valid number and
// causes the schema/Rust deserialization to fail with NaN.
// Serverless mode is selected by how we use registry.handler(), not by this env var.

/**
 * Lindi's Store — Rivet Actor Registry
 *
 * 9 actors powering the entire application:
 * - catalogActor     🏪 In-memory product index (serves SSR)
 * - inventoryActor   📦 Atomic stock management + realtime events
 * - cartActor        🛒 Per-session server-side cart
 * - orderActor       🔄 Durable multi-step order workflow
 * - paymentWorker    💳 Paystack verification queue
 * - emailWorker      📧 Maileroo delivery queue
 * - reviewWorker     ⭐ Review tokens + submissions
 * - analyticsActor   📊 Scheduled dashboard stats caching
 * - settingsActor    ⚙️ In-memory site configuration
 *
 * Runtime mode: SERVERLESS. The self-hosted engine's guard requires the
 * x-rivet-token HTTP header for WebSocket auth, but the RivetKit SDK only
 * sends auth via Sec-WebSocket-Protocol subprotocol (WebSocket API cannot
 * send custom headers). We therefore use the serverless HTTP handler at
 * /api/rivet/*, initialized in server/plugins/rivet-runner.ts.
 */
export const registry = setup({
  // Explicitly pass endpoint — Nitro's bundler may not propagate process.env
  // for RivetKit's internal env var reads, causing it to default to localhost:6420.
  endpoint: process.env.RIVET_ENDPOINT,

  // Envoy version — bump RIVET_RUNNER_VERSION on each deploy so the engine
  // drains stale runners. Placed under `envoy` where RivetKit expects it.
  envoy: {
    version: Number(process.env.RIVET_RUNNER_VERSION) || 1,
  },

  // Preload WASM bytes so the runtime never relies on fetch(import.meta.url)
  // for the .wasm file. Required for Bun dev and robust in production builds.
  wasm: {
    initInput: getWasmInitInput(),
  },

  use: {
    catalogActor,
    inventoryActor,
    cartActor,
    orderActor,
    paymentWorker,
    emailWorker,
    reviewWorker,
    analyticsActor,
    settingsActor,
  },
})
