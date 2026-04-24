import { z } from 'zod';

export const revenueQuerySchema = z.object({
  period: z.enum(['week', 'month', 'year']).optional(),
});
