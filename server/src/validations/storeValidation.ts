import { z } from 'zod';

export const createStoreSchema = z.object({
  name: z.string().trim().min(2, 'Do\'kon nomi kiritilishi shart').max(60),
  description: z.string().trim().max(1000).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(200).optional(),
});

export const updateStoreSchema = z.object({
  name: z.string().trim().min(2, 'Do\'kon nomi kiritilishi shart').max(60).optional(),
  description: z.string().trim().max(1000).optional(),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(200).optional(),
  isActive: z.boolean().optional(),
});

export const listStoresQuerySchema = z.object({
  q: z.string().trim().max(50).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
