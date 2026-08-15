import Store from '../models/Store';
import User from '../models/User';
import Product from '../models/Product';
import { ApiError } from '../utils/ApiError';

export interface StoreInput {
  name: string;
  description?: string;
  phone?: string;
  address?: string;
}

export interface StoreListQuery {
  q?: string;
  page?: number;
  limit?: number;
}

async function ensureSeller(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  if (user.role !== 'seller') throw new ApiError(403, 'Bu amal faqat seller uchun');
  if (!user.isApproved) {
    throw new ApiError(403, 'Do\'kon ochish uchun admin tomonidan tasdiqlanishi kerak');
  }
  return user;
}

export async function listStores(query: StoreListQuery = {}) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 12;
  const filter: Record<string, unknown> = { isActive: true };
  if (query.q) filter.name = { $regex: query.q, $options: 'i' };

  const [stores, total] = await Promise.all([
    Store.find(filter)
      .populate('owner', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Store.countDocuments(filter),
  ]);

  return { stores, total, page, pages: Math.ceil(total / limit) };
}

export async function getStoreBySlug(slug: string) {
  const store = await Store.findOne({ slug, isActive: true }).populate('owner', 'name avatar');
  if (!store) throw new ApiError(404, 'Do\'kon topilmadi');

  const products = await Product.find({ seller: store.owner._id, isActive: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 });

  const productCount = await Product.countDocuments({
    seller: store.owner._id,
    isActive: true,
  });

  return { store, products, productCount };
}

export async function getMyStore(userId: string) {
  const store = await Store.findOne({ owner: userId });
  if (!store) throw new ApiError(404, 'Do\'koningiz hali yaratilmagan');
  return store;
}

export async function createStore(userId: string, input: StoreInput) {
  await ensureSeller(userId);

  const existing = await Store.findOne({ owner: userId });
  if (existing) throw new ApiError(409, 'Sizda allaqachon do\'kon mavjud');

  const name = input.name.trim();
  const dup = await Store.findOne({ name });
  if (dup) throw new ApiError(409, 'Bu nomdagi do\'kon mavjud');

  const store = await Store.create({
    name,
    description: input.description ?? '',
    phone: input.phone ?? '',
    address: input.address ?? '',
    owner: userId,
  });

  await User.findByIdAndUpdate(userId, { storeId: store._id });
  return store;
}

export async function updateStore(userId: string, input: Partial<StoreInput> & { isActive?: boolean }) {
  const store = await Store.findOne({ owner: userId });
  if (!store) throw new ApiError(404, 'Do\'kon topilmadi');

  if (input.name !== undefined && input.name.trim() !== store.name) {
    const dup = await Store.findOne({ name: input.name.trim(), _id: { $ne: store._id } });
    if (dup) throw new ApiError(409, 'Bu nomdagi do\'kon mavjud');
    store.name = input.name.trim();
  }
  if (input.description !== undefined) store.description = input.description;
  if (input.phone !== undefined) store.phone = input.phone;
  if (input.address !== undefined) store.address = input.address;
  if (input.isActive !== undefined) store.isActive = input.isActive;

  await store.save();
  return store;
}

export async function setStoreImage(userId: string, field: 'logo' | 'banner', path: string) {
  const store = await Store.findOne({ owner: userId });
  if (!store) throw new ApiError(404, 'Do\'kon topilmadi');
  store[field] = path;
  await store.save();
  return store;
}
