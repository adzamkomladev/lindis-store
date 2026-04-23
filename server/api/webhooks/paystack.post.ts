import { createHmacSha512 } from '../../utils/hmac'
import type { PaystackWebhookPayload, PaystackChargeSuccessfulPayload } from '~~/types/paystack'
import { enqueuePayment } from '~/server/utils/queues'

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

  return 'OK'
})