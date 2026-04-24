import { z } from 'zod'

// MongoDB ObjectId string validator
const objectIdString = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ID')

export const reviewQuerySchema = z.object({
  cursor: z.string().optional(),  // ObjectId string cursor (was: coerce.number)
  limit: z.coerce.number().min(1).max(50).optional(),
})

export const reviewValidateSchema = z.object({
  token: z.string().min(1),
})

export const reviewSubmitSchema = z.object({
  token: z.string().min(1),
  reviews: z.array(z.object({
    productId: objectIdString,  // MongoDB ObjectId string (was: number)
    rating: z.number().int().min(1).max(5),
    title: z.string().max(100).optional(),
    comment: z.string().max(2000).optional(),
  })).min(1),
})
