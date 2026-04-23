import { enqueuePayment } from '~/server/utils/queues'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const reference = query.reference as string
  const { verifyTransaction } = usePaystack()

  if (!reference) {
    return sendRedirect(event, '/cart?error=missing_reference')
  }

  try {
    const data = await verifyTransaction(reference)

    if (data.status === 'success') {
      const orderNumber = data.metadata?.orderNumber as string

      // Route to paymentWorker queue for processing
      await enqueuePayment({
        reference: data.reference,
        orderNumber,
        amount: data.amount,
        metadata: data,
      })

      return sendRedirect(event, `/orders/success?ref=${reference}`)
    } else {
      return sendRedirect(event, `/cart?error=payment_failed`)
    }
  } catch (error) {
    console.error('[Verify] Payment verification failed:', error)
    return sendRedirect(event, '/cart?error=verification_failed')
  }
})
