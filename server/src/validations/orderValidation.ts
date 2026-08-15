import { z } from 'zod';

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  status: z
    .enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .optional(),
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  q: z.string().trim().max(50).optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(
    ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    { message: 'Noto\'g\'ri holat tanlandi' }
  ),
});
