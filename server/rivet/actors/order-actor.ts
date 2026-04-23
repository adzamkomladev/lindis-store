import { actor, queue, UserError } from 'rivetkit'
import { workflow, Loop } from 'rivetkit/workflow'
import type { OrderDoc, OrderItemDoc } from '~/server/db/types'
import type { CartItem, AppliedDiscount } from './cart-actor'

export type OrderPhase =
  | 'initiating'
  | 'inventory_reserved'
  | 'awaiting_payment'
  | 'paid'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export interface InitiateOrderCommand {
  type: 'initiate'
  userId?: string
  guestEmail: string
  items: CartItem[]
  discount: AppliedDiscount | null
  shippingDetails: OrderDoc['shippingDetails']
  paystackReference: string
}

export interface PaymentConfirmedCommand {
  type: 'payment_confirmed'
  reference: string
  amount: number
  metadata?: Record<string, unknown>
}

export type OrderCommand = InitiateOrderCommand | PaymentConfirmedCommand

export const orderActor = actor({
  options: { name: 'Order Workflow', icon: '🔄' },
  state: {
    order: null as OrderDoc | null,
    phase: 'initiating' as OrderPhase,
  },
  queues: {
    commands: queue<OrderCommand>(),
  },
  run: workflow(async (ctx) => {
    // Step 1: Wait for and process the initiate command
    const initCmd = await ctx.queue.next('wait-initiate') as { body: InitiateOrderCommand }
    const data = initCmd.body

    await ctx.step('create-order', async () => {
      const { collections } = await import('~/server/db/collections')
      const { ObjectId } = await import('mongodb')
      const { orders } = collections()

      const subtotal = data.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
      const discountAmount = data.discount?.discountAmount ?? 0
      const total = Math.max(0, subtotal - discountAmount)

      const orderDoc: OrderDoc = {
        orderNumber: ctx.key[0],
        userId: data.userId ? new ObjectId(data.userId) : undefined,
        guestEmail: data.guestEmail,
        status: 'pending',
        paymentStatus: 'unpaid',
        subtotal,
        discountAmount,
        total,
        discount: data.discount
          ? { code: data.discount.code, type: data.discount.type, value: data.discount.value }
          : null,
        items: data.items.map((item): OrderItemDoc => ({
          productId: new ObjectId(item.productId),
          productName: item.productName,
          productSlug: item.productSlug,
          productImages: item.productImages,
          quantity: item.quantity,
          priceAtPurchase: item.price,
          customText: item.customText,
        })),
        payment: {
          reference: data.paystackReference,
          provider: 'paystack',
          amount: total,
          status: 'pending',
        },
        shippingDetails: data.shippingDetails,
        createdAt: new Date(),
      }

      const result = await orders.insertOne(orderDoc as any)
      ctx.state.order = { ...orderDoc, _id: result.insertedId }
    })

    await ctx.step('reserve-inventory', async () => {
      const client = ctx.client<typeof import('../registry').registry>()
      for (const item of data.items) {
        await client.inventoryActor
          .getOrCreate(['main'])
          .reserve(item.productId, item.quantity)
      }
      ctx.state.phase = 'inventory_reserved'
    })

    ctx.state.phase = 'awaiting_payment'

    // Step 2: Wait for payment confirmation (pushed by paymentWorker)
    const paymentCmd = await ctx.queue.next('wait-payment') as { body: PaymentConfirmedCommand }

    await ctx.step('confirm-payment', async () => {
      const { collections } = await import('~/server/db/collections')
      const { ObjectId } = await import('mongodb')
      const { orders } = collections()

      const payData = paymentCmd.body
      await orders.updateOne(
        { _id: ctx.state.order!._id },
        {
          $set: {
            paymentStatus: 'paid',
            status: 'processing',
            'payment.status': 'success',
            'payment.amount': payData.amount,
            'payment.processedAt': new Date(),
            'payment.metadata': payData.metadata ?? {},
          },
        }
      )

      if (ctx.state.order) {
        ctx.state.order.paymentStatus = 'paid'
        ctx.state.order.status = 'processing'
        ctx.state.order.payment.status = 'success'
      }
      ctx.state.phase = 'paid'
    })

    await ctx.step('send-order-confirmation', async () => {
      const client = ctx.client<typeof import('../registry').registry>()
      const order = ctx.state.order!
      await client.emailWorker.getOrCreate(['main']).emails.push({
        to: order.guestEmail,
        subject: `Order Confirmed - ${order.orderNumber}`,
        templateId: 'order_confirmation',
        data: {
          orderNumber: order.orderNumber,
          items: order.items,
          total: order.total,
          shippingDetails: order.shippingDetails,
        },
      })
      ctx.state.phase = 'confirmed'
    })

    await ctx.step('increment-discount-usage', async () => {
      if (!ctx.state.order?.discount?.code) return
      const { collections } = await import('~/server/db/collections')
      const { discountCodes } = collections()
      await discountCodes.updateOne(
        { code: ctx.state.order.discount.code },
        { $inc: { usedCount: 1 } }
      )
    })

    // Step 3: Schedule review request 7 days after order
    await ctx.step('schedule-review', async () => {
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
      ctx.schedule.after(SEVEN_DAYS_MS, 'triggerReviewRequest')
    })
  }),

  actions: {
    getOrder: (c) => c.state.order,
    getPhase: (c) => c.state.phase,

    // Admin: update order status manually
    updateStatus: async (c, status: OrderDoc['status']) => {
      if (!c.state.order?._id) throw new UserError('Order not found', { code: 'not_found' })
      const { collections } = await import('~/server/db/collections')
      const { ObjectId } = await import('mongodb')
      const { orders } = collections()
      await orders.updateOne(
        { _id: c.state.order._id },
        { $set: { status } }
      )
      c.state.order.status = status
      c.state.phase = status as OrderPhase
    },

    // Triggered by scheduler — 7 days after order
    triggerReviewRequest: async (c) => {
      const order = c.state.order
      if (!order || order.paymentStatus !== 'paid') return

      const client = c.client<typeof import('../registry').registry>()
      await client.reviewWorker.getOrCreate(['main']).reviewRequests.push({
        orderId: order._id!.toString(),
        orderNumber: order.orderNumber,
        email: order.guestEmail,
        customerName: order.shippingDetails.name,
        items: order.items.map(i => ({
          productId: i.productId.toString(),
          productName: i.productName,
          productImages: i.productImages,
        })),
      })
    },
  },
})
