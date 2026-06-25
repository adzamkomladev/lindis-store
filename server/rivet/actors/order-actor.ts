import { actor, queue, UserError } from 'rivetkit'
import { workflow } from 'rivetkit/workflow'
import type { OrderDoc, OrderItemDoc, SerializedOrder, SerializedOrderItem } from '~/server/db/types'
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

export interface PaymentFailedCommand {
  type: 'payment_failed'
  reference: string
  reason?: string
}

export type OrderCommand = InitiateOrderCommand | PaymentConfirmedCommand | PaymentFailedCommand

export const orderActor = actor({
  options: { name: 'Order Workflow', icon: '🔄' },
  state: {
    order: null as SerializedOrder | null,
    phase: 'initiating' as OrderPhase,
  },
  queues: {
    commands: queue<OrderCommand>(),
  },
  run: workflow(async (ctx) => {
    const initCmd = await ctx.queue.next('wait-initiate') as { body: InitiateOrderCommand }
    const data = initCmd.body

    await ctx.step('create-order', async (step) => {
      const { collections } = await import('~/server/db/collections')
      const { orders } = collections()

      const created = await orders.findOne({ orderNumber: step.key[0] })
      if (!created) {
        throw new Error(`Order ${step.key[0]} not found in MongoDB — should have been created by initiate endpoint`)
      }
      step.state.order = {
        ...created,
        _id: created._id.toString(),
        items: created.items.map(i => ({ ...i, productId: i.productId.toString() })),
      }
    })

    await ctx.step('reserve-inventory', async (step) => {
      const client = step.client<typeof import('../registry').registry>()
      for (const item of data.items) {
        await client.inventoryActor
          .getOrCreate(['main'])
          .reserve(item.productId, item.quantity)
      }
      step.state.phase = 'inventory_reserved'
    })

    await ctx.step('mark-awaiting-payment', async (step) => {
      step.state.phase = 'awaiting_payment'
    })

    const paymentMsg = await ctx.queue.next('wait-payment')

    if (paymentMsg.body.type === 'payment_failed') {
      await ctx.step('handle-payment-failed', async (step) => {
        const { collections } = await import('~/server/db/collections')
        const { ObjectId } = await import('mongodb')
        const { orders } = collections()

        if (step.state.order?._id) {
          await orders.updateOne(
            { _id: new ObjectId(step.state.order._id) },
            {
              $set: {
                status: 'cancelled',
                paymentStatus: 'failed',
                'payment.status': 'failed',
              },
            }
          )

          const client = step.client<typeof import('../registry').registry>()
          for (const item of step.state.order.items) {
            await client.inventoryActor
              .getOrCreate(['main'])
              .release(item.productId, item.quantity)
          }
        }
        step.state.phase = 'cancelled'
      })
      return
    }

    await ctx.step('confirm-payment', async (step) => {
      const { collections } = await import('~/server/db/collections')
      const { ObjectId } = await import('mongodb')
      const { orders } = collections()

      const payData = paymentMsg.body as PaymentConfirmedCommand
      await orders.updateOne(
        { _id: new ObjectId(step.state.order!._id) },
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

      if (step.state.order) {
        step.state.order.paymentStatus = 'paid'
        step.state.order.status = 'processing'
        step.state.order.payment.status = 'success'
      }
      step.state.phase = 'paid'
    })

    await ctx.step('send-order-confirmation', async (step) => {
      const client = step.client<typeof import('../registry').registry>()
      const order = step.state.order!
      await client.emailWorker.getOrCreate(['main']).send('emails', {
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
      step.state.phase = 'confirmed'
    })

    await ctx.step('increment-discount-usage', async (step) => {
      if (!step.state.order?.discount?.code) return
      const { collections } = await import('~/server/db/collections')
      const { discountCodes } = collections()
      await discountCodes.updateOne(
        { code: step.state.order.discount.code },
        { $inc: { usedCount: 1 } }
      )
    })

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
    await ctx.sleep('review-wait', SEVEN_DAYS_MS)

    await ctx.step('send-review-request', async (step) => {
      const order = step.state.order
      if (!order || order.paymentStatus !== 'paid') return

      const client = step.client<typeof import('../registry').registry>()
      await client.reviewWorker.getOrCreate(['main']).send('reviewRequests', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        email: order.guestEmail,
        customerName: order.shippingDetails.name,
        items: order.items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          productImages: i.productImages,
        })),
      })
    })
  }),

  actions: {
    getOrder: (c) => c.state.order,
    getPhase: (c) => c.state.phase,

    updateStatus: async (c, status: OrderDoc['status']) => {
      if (!c.state.order?._id) throw new UserError('Order not found', { code: 'not_found' })
      const { collections } = await import('~/server/db/collections')
      const { ObjectId } = await import('mongodb')
      const { orders } = collections()
      await orders.updateOne(
        { _id: new ObjectId(c.state.order._id) },
        { $set: { status } }
      )
      c.state.order.status = status
      c.state.phase = status as OrderPhase
    },

    triggerReviewRequest: async (c) => {
      const order = c.state.order
      if (!order || order.paymentStatus !== 'paid') return

      const client = c.client<typeof import('../registry').registry>()
      await client.reviewWorker.getOrCreate(['main']).send('reviewRequests', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        email: order.guestEmail,
        customerName: order.shippingDetails.name,
        items: order.items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          productImages: i.productImages,
        })),
      })
    },
  },
})
