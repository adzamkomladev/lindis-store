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
 */
export const registry = setup({
  // Explicitly pass endpoint — Nitro's bundler may not propagate process.env
  // for RivetKit's internal env var reads, causing it to default to localhost:6420.
  // Self-hosted Rivet Engine: https://komla:token@rivet.yebi.africa
  endpoint: process.env.RIVET_ENDPOINT,
  // Versioning is required for production so Rivet can distinguish
  // old deployments from new ones and drain stale runners safely.
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
