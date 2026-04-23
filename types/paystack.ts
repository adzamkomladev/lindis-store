export interface PaystackWebhookPayload {
  event: string
  data: any
}

export interface PaystackChargeSuccessfulPayload {
  reference: string
  amount: number
  status: string
  metadata: {
    orderId: number
    orderNumber: string
  }
}

export type SuccessfulPaymentsPayload = PaystackChargeSuccessfulPayload