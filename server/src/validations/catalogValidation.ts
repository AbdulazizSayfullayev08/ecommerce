import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'Kategoriya nomi kamida 2 ta belgi'),
  description: z.string().trim().max(500).optional(),
  image: z.string().trim().max(300).optional(),
  parent: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  order: z.number().int().min(0).optional(),
});

export const productSchema = z.object({
  category: z.string().trim().min(1, 'Kategoriya tanlanishi shart'),
  name: z.string().trim().min(2, 'Mahsulot nomi kamida 2 ta belgi'),
  description: z.string().trim().max(5000).optional(),
  brand: z.string().trim().max(100).optional(),
  price: z.number().nonnegative('Narx manfiy bo\'lishi mumkin emas'),
  compareAtPrice: z.number().nonnegative().optional(),
  stock: z.number().int().nonnegative().optional(),
  sku: z.string().trim().max(50).optional(),
  images: z.array(z.string().trim().max(300)).max(8).optional(),
  attributes: z.record(z.string(), z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = productSchema.partial();

export const listProductsQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(80).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  seller: z.string().trim().optional(),
  inStock: z.enum(['true', 'false']).optional(),
  isFeatured: z.enum(['true', 'false']).optional(),
  sort: z
    .enum(['newest', 'price_asc', 'price_desc', 'rating', 'oldest'])
    .optional()
    .default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(12),
});
