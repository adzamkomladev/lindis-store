import { actor, queue } from 'rivetkit'

export interface PaymentPayload {
  reference: string
  orderNumber: string
  amount: number
  metadata?: Record<string, unknown>
}

export interface VerifyPaymentPayload {
  reference: string
  orderNumber: string
}

export const paymentWorker = actor({
  options: { name: 'Payment Processor', icon: '💳' },
  state: {
    processed: 0,
    failed: 0,
  },
  queues: {
    payments: queue<PaymentPayload>(),
    verifyPayments: queue<VerifyPaymentPayload>(),
  },
  run: async (c) => {
    for await (const message of c.queue.iter()) {
      if (message.name === 'payments') {
        const { reference, orderNumber, amount, metadata } = message.body

        // Verify with Paystack
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${paystackSecretKey}` },
        })
        const data = await response.json() as any

        if (data.status && data.data?.status === 'success') {
          // Notify the order actor to continue its workflow
          const client = c.client<typeof import('../registry').registry>()
          await client.orderActor
            .getOrCreate([orderNumber])
            .commands.push({
              type: 'payment_confirmed',
              reference,
              amount: data.data.amount,
              metadata: data.data,
            })

          c.state.processed += 1
        } else {
          // Update order payment status to failed in MongoDB
          const { collections } = await import('~/server/db/collections')
          const { orders } = collections()
          await orders.updateOne(
            { orderNumber },
            { $set: { 'payment.status': 'failed' } }
          )
          c.state.failed += 1
        }
      }

      if (message.name === 'verifyPayments') {
        const { reference, orderNumber } = message.body
        const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { Authorization: `Bearer ${paystackSecretKey}` },
        })
        const data = await response.json() as any

        if (data.status && data.data?.status === 'success') {
          // Re-enqueue as confirmed payment
          await c.queue.payments.push({ reference, orderNumber, amount: data.data.amount, metadata: data.data })
        }
      }
    }
  },
  actions: {
    getStats: (c) => ({
      processed: c.state.processed,
      failed: c.state.failed,
    }),
  },
})
