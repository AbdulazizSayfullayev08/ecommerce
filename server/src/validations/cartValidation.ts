import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.string().trim().min(1, 'Mahsulot tanlanishi shart'),
  qty: z.coerce.number().int().min(1, 'Miqdor kamida 1').max(99).default(1),
});

export const updateQtySchema = z.object({
  qty: z.coerce.number().int().min(0, 'Miqdor manfiy bo\'lishi mumkin emas').max(99),
});

export const applyCouponSchema = z.object({
  code: z.string().trim().min(1, 'Kod kiritilishi shart').max(50),
});
