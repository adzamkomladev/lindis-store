import { z } from 'zod'

// MongoDB ObjectId string validator
const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID')

export const cartItemSchema = z.object({
  productId: objectIdString,
  quantity: z.number().int().min(1),
  customTexts: z.array(z.string()).optional(),
})

export const checkoutSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
})

export type CartItem = z.infer<typeof cartItemSchema>
export type CheckoutInput = z.infer<typeof checkoutSchema>

export const verifyPaymentSchema = z.object({
  orderNumber: z.string(),
  paymentReference: z.string(),
})

export const initiateOrderSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  discountCode: z.string().optional(),
  items: z.array(z.object({
    id: objectIdString,        // MongoDB ObjectId string
    name: z.string(),
    slug: z.string(),
    price: z.number(),
    quantity: z.number(),
    images: z.array(z.string()).optional(),
    customText: z.string().optional(),
    customTexts: z.array(z.string()).optional(),
  }))
})

export const updateOrderSchema = z.object({
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).optional(),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']).optional(),
})
