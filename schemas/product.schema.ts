import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, 'Price must be greater than 0'),
  inventoryCount: z.coerce.number().int().min(0, 'Inventory cannot be negative'),
  images: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  isFeatured: z.boolean().default(false),
  // Kitchen store — category required
  category: z.enum([
    'blenders',
    'baking',
    'utensils',
    'cookware',
    'tupperwares',
    'appliances',
    'storage',
    'other'
  ]).default('other'),
  // Specifications
  specMaterial: z.string().optional(),
  specCapacity: z.string().optional(),
  specDimensions: z.string().optional(),
  specWeight: z.string().optional(),
  specInsulation: z.string().optional(),
  specTempRetention: z.string().optional(),
})

export type ProductInput = z.infer<typeof productSchema>

export const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  inventoryCount: z.number().min(0).optional(),
  images: z.array(z.string()).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
  category: z.enum([
    'blenders',
    'baking',
    'utensils',
    'cookware',
    'tupperwares',
    'appliances',
    'storage',
    'other'
  ]).optional(),
  // Specifications
  specMaterial: z.string().optional().nullable(),
  specCapacity: z.string().optional().nullable(),
  specDimensions: z.string().optional().nullable(),
  specWeight: z.string().optional().nullable(),
  specInsulation: z.string().optional().nullable(),
  specTempRetention: z.string().optional().nullable(),
})
