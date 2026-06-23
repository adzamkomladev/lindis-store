import { setup } from 'rivetkit'
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
 * Maps RIVET_RUNNER_VERSION → RIVET_ENVOY_VERSION so the envoy config
 * picks it up. The SDK reads RIVET_ENVOY_VERSION for drain-on-upgrade
 * versioning; RIVET_RUNNER_VERSION is the documented user-facing alias.
 *
 * Must run before setup() evaluates the config. Bump RIVET_RUNNER_VERSION
 * on each deploy so the engine drains stale envoys.
 *
 * @see https://rivet.dev/docs/actors/versions
 */
function ensureRivetEnvoyVersion(): void {
  if (process.env.RIVET_ENVOY_VERSION) return
  if (process.env.RIVET_RUNNER_VERSION) {
    process.env.RIVET_ENVOY_VERSION = process.env.RIVET_RUNNER_VERSION
  }
}

ensureRivetEnvoyVersion()

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
 * Runtime mode: RUNNER (envoy). The app holds actors resident in memory
 * and the Rivet Engine routes calls to it via a persistent WebSocket.
 * registry.startEnvoy() is called from server/plugins/rivet-runner.ts
 * at Nitro startup — NOT here, to keep setup() pure.
 *
 * Self-hosted Rivet Engine: https://komla:<token>@rivet.yebi.africa
 */
export const registry = setup({
  // Explicitly pass endpoint — Nitro's bundler may not propagate process.env
  // for RivetKit's internal env var reads, causing it to default to localhost:6420.
  endpoint: process.env.RIVET_ENDPOINT,
  // Versioning is required for production so Rivet can distinguish
  // old deployments from new ones and drain stale runners safely.
  // RIVET_RUNNER_VERSION is mapped to RIVET_ENVOY_VERSION above;
  // the envoy config picks it up automatically.
  version: process.env.RIVET_RUNNER_VERSION || '1',
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
