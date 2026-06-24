import { enqueuePayment } from '~/server/utils/queues'
import { useRivet } from '~/server/rivet/client'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const reference = query.reference as string
  const { verifyTransaction } = usePaystack()

  if (!reference) {
    return sendRedirect(event, '/cart?error=missing_reference')
  }

  const orderNumberFromRef = reference.startsWith('pay-') ? reference.slice(4) : null

  try {
    const data = await verifyTransaction(reference)

    if (data.status === 'success') {
      const orderNumber = (data.metadata?.orderNumber as string) || orderNumberFromRef

      // Route to paymentWorker queue for processing
      await enqueuePayment({
        reference: data.reference,
        orderNumber: orderNumber || reference,
        amount: data.amount,
        metadata: data,
      })

      return sendRedirect(event, `/orders/success?ref=${reference}`)
    } else {
      // Notify order actor about payment failure
      if (orderNumberFromRef) {
        try {
          const rivet = useRivet()
          await rivet.orderActor.getOrCreate([orderNumberFromRef]).send('commands', {
            type: 'payment_failed',
            reference,
            reason: 'Paystack redirect verification returned non-success',
          })
        } catch (err) {
          console.error(`[Verify] Failed to notify order actor:`, (err as Error).message)
        }
      }
      return sendRedirect(event, `/cart?error=payment_failed`)
    }
  } catch (error) {
    console.error('[Verify] Payment verification failed:', error)
    // Notify order actor about failure
    if (orderNumberFromRef) {
      try {
        const rivet = useRivet()
        await rivet.orderActor.getOrCreate([orderNumberFromRef]).send('commands', {
          type: 'payment_failed',
          reference,
          reason: 'Paystack redirect verification threw error',
        })
      } catch (err) {
        console.error(`[Verify] Failed to notify order actor:`, (err as Error).message)
      }
    }
    return sendRedirect(event, '/cart?error=verification_failed')
  }
})
