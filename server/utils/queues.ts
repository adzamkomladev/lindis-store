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
  await rivet.emailWorker.getOrCreate(['main']).emails.push(payload)
}

export async function enqueuePayment(payload: PaymentPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.paymentWorker.getOrCreate(['main']).payments.push(payload)
}

export async function enqueueVerifyPayment(payload: VerifyPaymentPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.paymentWorker.getOrCreate(['main']).verifyPayments.push(payload)
}

export async function enqueueReviewRequest(payload: ReviewRequestPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.reviewWorker.getOrCreate(['main']).reviewRequests.push(payload)
}

export async function enqueueReviewSubmission(payload: ReviewSubmissionPayload): Promise<void> {
  const rivet = useRivet()
  await rivet.reviewWorker.getOrCreate(['main']).reviewSubmissions.push(payload)
}
