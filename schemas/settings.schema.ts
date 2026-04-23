import { z } from 'zod';

export const settingsSchema = z.object({
  settings: z.array(z.object({
    key: z.string(),
    value: z.string().nullable(),
  }))
});
