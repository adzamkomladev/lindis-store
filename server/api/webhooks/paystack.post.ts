import { createHmacSha512 } from '../../utils/hmac'
import type { PaystackWebhookPayload, PaystackChargeSuccessfulPayload } from '~~/types/paystack'
import { enqueuePayment } from '~/server/utils/queues'
import { useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  const body = await readRawBody(event, 'utf8')
  if (!body) throw createError({ statusCode: 400, statusMessage: 'Bad Request' })

  const signature = getHeader(event, 'x-paystack-signature')
  if (!signature) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })

  const config = useRuntimeConfig()
  const secret = config.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY

  if (!secret) {
    console.error('[Paystack Webhook] PAYSTACK_SECRET_KEY missing')
    throw createError({ statusCode: 500, message: 'Server configuration error' })
  }

  const hmac = await createHmacSha512(body, secret)
  if (hmac !== signature) {
    console.error('[Paystack Webhook] Invalid signature')
    throw createError({ statusCode: 401, statusMessage: 'Invalid signature' })
  }

  const payload: PaystackWebhookPayload = JSON.parse(body)
  console.log(`[Paystack Webhook] Event: ${payload.event}`)

  if (payload.event === 'charge.success') {
    const chargeData = payload.data as PaystackChargeSuccessfulPayload

    // Enqueue to Rivet paymentWorker actor — replaces Cloudflare Queue
    await enqueuePayment({
      reference: chargeData.reference,
      orderNumber: chargeData.metadata?.orderNumber ?? chargeData.reference,
      amount: chargeData.amount,
      metadata: chargeData as unknown as Record<string, unknown>,
    })

    console.log(`[Paystack Webhook] Queued payment: ${chargeData.reference}`)
  }

  if (payload.event === 'charge.failed') {
    const chargeData = payload.data as any
    const orderNumber = chargeData.metadata?.orderNumber

    if (orderNumber) {
      try {
        const rivet = useRivet()
        await rivet.orderActor.getOrCreate([orderNumber]).send('commands', {
          type: 'payment_failed',
          reference: chargeData.reference,
          reason: 'Paystack charge.failed webhook received',
        })
        console.log(`[Paystack Webhook] Notified order actor about failed payment: ${chargeData.reference}`)
      } catch (err) {
        console.error(`[Paystack Webhook] Failed to notify order actor:`, (err as Error).message)
      }
    }
  }

  return 'OK'
})