import { useRivet } from '~/server/rivet/client'
import type { EmailPayload } from '~/server/rivet/actors/email-worker'
import type { PaymentPayload, VerifyPaymentPayload } from '~/server/rivet/actors/payment-worker'
import type { ReviewRequestPayload, ReviewSubmissionPayload } from '~/server/rivet/actors/review-worker'

/**
 * Queue helpers — thin wrappers around Rivet actor queues.
 * These replace the Cloudflare Queue bindings.
 */

export async function enqueueEmail(payload: EmailPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.emailWorker.getOrCreate(['main']).send('emails', payload)
}

export async function enqueuePayment(payload: PaymentPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.paymentWorker.getOrCreate(['main']).send('payments', payload)
}

export async function enqueueVerifyPayment(payload: VerifyPaymentPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.paymentWorker.getOrCreate(['main']).send('verifyPayments', payload)
}

export async function enqueuePaymentFailed(payload: { reference: string; orderNumber: string; reason?: string }): Promise<void> {
  const rivet = useRivet()
  await rivet.orderActor.getOrCreate([payload.orderNumber]).send('commands', {
    type: 'payment_failed',
    reference: payload.reference,
    reason: payload.reason,
  })
}

export async function enqueueReviewRequest(payload: ReviewRequestPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.reviewWorker.getOrCreate(['main']).send('reviewRequests', payload)
}

export async function enqueueReviewSubmission(payload: ReviewSubmissionPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.reviewWorker.getOrCreate(['main']).send('reviewSubmissions', payload)
}
