import mongoose from 'mongoose';
import path from 'path';
import Product from '../models/Product';
import Category from '../models/Category';
import User from '../models/User';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export interface ProductInput {
  category: string;
  name: string;
  description?: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  stock?: number;
  sku?: string;
  images?: string[];
  attributes?: Record<string, string>;
  isActive?: boolean;
}

export interface ListProductsQuery {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  seller?: string;
  inStock?: 'true' | 'false';
  isFeatured?: 'true' | 'false';
  sort?: string;
  page?: number;
  limit?: number;
  activeOnly?: boolean;
}

const SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { averageRating: -1 },
};

function isValidObjectId(id: string): boolean {
  return mongoose.isValidObjectId(id);
}

async function assertCanManage(sellerId: string, isAdmin: boolean) {
  if (isAdmin) return;
  const user = await User.findById(sellerId);
  if (!user) throw new ApiError(401, 'Foydalanuvchi topilmadi');
  if (user.role !== 'seller' || !user.isApproved) {
    throw new ApiError(403, 'Mahsulot qo\'shish uchun seller sifatida tasdiqlanishi kerak');
  }
}

export async function listProducts(query: ListProductsQuery) {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    seller,
    inStock,
    isFeatured,
    sort = 'newest',
    page = 1,
    limit = 12,
    activeOnly = true,
  } = query;

  const filter: Record<string, unknown> = {};

  if (activeOnly) {
    filter.isActive = true;
    const activeCategories = await Category.find({ isActive: true }).select('_id');
    filter.category = { $in: activeCategories.map((c) => c._id) };
  }

  if (category) {
    const cat = await Category.findOne({ slug: category });
    if (cat) filter.category = cat._id;
    else filter.category = null;
  }

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const price: { $gte?: number; $lte?: number } = {};
    if (minPrice !== undefined) price.$gte = minPrice;
    if (maxPrice !== undefined) price.$lte = maxPrice;
    filter.price = price;
  }

  if (seller) {
    if (isValidObjectId(seller)) filter.seller = seller;
    else filter.seller = null;
  }

  if (inStock === 'true') filter.stock = { $gt: 0 };
  if (inStock === 'false') filter.stock = 0;
  if (isFeatured === 'true') filter.isFeatured = true;

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(SORT_MAP[sort] ?? SORT_MAP.newest)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('category', 'name slug')
    .populate('seller', 'name avatar');

  return {
    products,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, isActive: true })
    .populate('category', 'name slug')
    .populate('seller', 'name avatar');
  if (!product) throw new ApiError(404, 'Mahsulot topilmadi');
  return product;
}

export async function getFeaturedProducts(limit = 8) {
  const products = await Product.find({ isActive: true, isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug')
    .populate('seller', 'name avatar');
  return products;
}

export async function createProduct(sellerId: string, isAdmin: boolean, input: ProductInput) {
  await assertCanManage(sellerId, isAdmin);

  const category = await Category.findById(input.category);
  if (!category) throw new ApiError(400, 'Kategoriya topilmadi');

  const product = await Product.create({
    seller: sellerId,
    category: input.category,
    name: input.name,
    description: input.description,
    brand: input.brand,
    price: input.price,
    compareAtPrice: input.compareAtPrice,
    stock: input.stock ?? 0,
    sku: input.sku,
    images: input.images ?? [],
    attributes: input.attributes ?? {},
    isActive: input.isActive ?? true,
  });

  return product;
}

export async function updateProduct(
  productId: string,
  actorId: string,
  isAdmin: boolean,
  input: Partial<ProductInput>
) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Mahsulot topilmadi');

  if (product.seller.toString() !== actorId && !isAdmin) {
    throw new ApiError(403, 'Bu mahsulotni o\'zgartirishga ruxsat yo\'q');
  }

  if (input.category !== undefined) {
    const category = await Category.findById(input.category);
    if (!category) throw new ApiError(400, 'Kategoriya topilmadi');
    product.category = category._id;
  }

  const fields: (keyof ProductInput)[] = [
    'name',
    'description',
    'brand',
    'price',
    'compareAtPrice',
    'stock',
    'sku',
    'images',
    'attributes',
    'isActive',
  ];

  for (const field of fields) {
    const value = input[field];
    if (value !== undefined) {
      (product as unknown as Record<string, unknown>)[field] = value;
    }
  }

  await product.save();
  return product;
}

export async function deleteProduct(productId: string, actorId: string, isAdmin: boolean) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Mahsulot topilmadi');

  if (product.seller.toString() !== actorId && !isAdmin) {
    throw new ApiError(403, 'Bu mahsulotni o\'chirishga ruxsat yo\'q');
  }

  await product.deleteOne();
  return product;
}

export async function toggleProductActive(
  productId: string,
  actorId: string,
  isAdmin: boolean,
  isActive: boolean
) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Mahsulot topilmadi');
  if (product.seller.toString() !== actorId && !isAdmin) {
    throw new ApiError(403, 'Ruxsat yo\'q');
  }
  product.isActive = isActive;
  await product.save();
  return product;
}

export async function addProductImages(
  productId: string,
  actorId: string,
  isAdmin: boolean,
  files: Express.Multer.File[]
) {
  const product = await Product.findById(productId);
  if (!product) throw new ApiError(404, 'Mahsulot topilmadi');
  if (product.seller.toString() !== actorId && !isAdmin) {
    throw new ApiError(403, 'Ruxsat yo\'q');
  }
  if (files.length === 0) throw new ApiError(400, 'Fayl yuklanmadi');

  const paths = files.map(
    (f) => `/${env.upload.dir}/products/${path.basename(f.path)}`
  );
  product.images = [...product.images, ...paths].slice(0, 8);
  await product.save();
  return product;
}

export async function listSellerProducts(sellerId: string, query: ListProductsQuery) {
  const { page = 1, limit = 20 } = query;
  const filter = { seller: sellerId };
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('category', 'name slug');

  return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
}
