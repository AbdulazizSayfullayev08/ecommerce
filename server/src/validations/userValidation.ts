import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Ism kamida 2 ta belgi bo\'lishi kerak')
    .max(60, 'Ism 60 ta belgidan oshmasligi kerak')
    .optional(),
  phone: z.string().trim().max(20).optional(),
});

export const addressSchema = z.object({
  label: z.string().trim().max(30).optional(),
  fullName: z.string().trim().min(2, 'Qabul qiluvchi ismi kiritilishi shart'),
  phone: z.string().trim().min(7, 'Telefon raqami kiritilishi shart'),
  country: z.string().trim().max(60).optional(),
  region: z.string().trim().min(2, 'Viloyat kiritilishi shart'),
  city: z.string().trim().min(2, 'Shahar kiritilishi shart'),
  street: z.string().trim().min(3, 'Ko\'cha/manzil kiritilishi shart'),
  zip: z.string().trim().max(20).optional(),
  isDefault: z.boolean().optional(),
});

export const roleSchema = z.object({
  role: z.enum(['customer', 'seller', 'admin'], {
    message: 'Noto\'g\'ri rol tanlandi',
  }),
});

export const blockSchema = z.object({
  isBlocked: z.boolean(),
});

export const approveSchema = z.object({
  isApproved: z.boolean(),
});

export const listUsersSchema = z.object({
  search: z.string().trim().max(60).optional(),
  role: z.enum(['customer', 'seller', 'admin']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
