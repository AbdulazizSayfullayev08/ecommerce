import { z } from 'zod';

export const couponSchema = z.object({
  code: z.string().trim().min(2, 'Kod kamida 2 ta belgi').max(50),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().positive('Qiymat musbat bo\'lishi kerak'),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxDiscount: z.coerce.number().nonnegative().optional(),
  expiresAt: z.string().datetime({ offset: true }).or(z.string().optional()).optional(),
  usageLimit: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const updateCouponSchema = couponSchema.partial();
