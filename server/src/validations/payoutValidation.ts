import { z } from 'zod';

export const requestPayoutSchema = z.object({
  amount: z.coerce.number().positive('Summa musbat bo\'lishi kerak').max(1_000_000_000),
});

export const payoutStatusSchema = z.object({
  status: z.enum(['paid', 'rejected'], { message: 'Noto\'g\'ri holat' }),
});
