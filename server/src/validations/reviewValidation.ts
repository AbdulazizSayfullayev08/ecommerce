import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.coerce
    .number()
    .int('Baholash butun son bo\'lishi kerak')
    .min(1, 'Kamida 1 yulduz')
    .max(5, 'Ko\'pi bilan 5 yulduz'),
  comment: z
    .string()
    .max(1000, 'Sharh juda uzun (maksimal 1000 belgi)')
    .optional()
    .or(z.literal('')),
});

export const updateReviewSchema = createReviewSchema.partial();
