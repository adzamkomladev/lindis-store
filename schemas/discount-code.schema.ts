import { z } from 'zod'

const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID')

export const validateDiscountSchema = z.object({
  code: z.string().min(1),
  cartTotal: z.number().min(0),       // in pesewas
  cartQuantity: z.number().int().min(0),
  productIds: z.array(z.string()).optional(),  // ObjectId strings (was: numbers)
})

export const createDiscountCodeSchema = z.object({
  code: z.string().min(3).max(30).transform(s => s.toUpperCase()),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed', 'free_shipping']),
  value: z.number().min(0),
  minOrderAmount: z.number().min(0).optional().nullable(),
  minQuantity: z.number().int().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  productId: objectIdString.optional().nullable(),  // ObjectId string (was: number)
  categoryName: z.string().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable().transform(v => v ? new Date(v) : null),
  expiresAt: z.string().datetime().optional().nullable().transform(v => v ? new Date(v) : null),
  isActive: z.boolean().default(true),
})

export const updateDiscountCodeSchema = z.object({
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed', 'free_shipping']).optional(),
  value: z.number().min(0).optional(),
  minOrderAmount: z.number().min(0).optional().nullable(),
  minQuantity: z.number().int().min(0).optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  productId: objectIdString.optional().nullable(),  // ObjectId string (was: number)
  categoryName: z.string().optional().nullable(),
  startsAt: z.string().datetime().optional().nullable().transform(v => v ? new Date(v) : null),
  expiresAt: z.string().datetime().optional().nullable().transform(v => v ? new Date(v) : null),
  isActive: z.boolean().optional(),
})
