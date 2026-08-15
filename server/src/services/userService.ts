import fs from 'fs';
import path from 'path';
import User, { UserAddress } from '../models/User';
import Store from '../models/Store';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { UserRole } from '../types';

export interface UpdateProfileInput {
  name?: string;
  phone?: string;
}

export interface AddressInput {
  label?: string;
  fullName: string;
  phone: string;
  country?: string;
  region: string;
  city: string;
  street: string;
  zip?: string;
  isDefault?: boolean;
}

function fileToPublicPath(filePath: string): string {
  return `/${env.upload.dir}/avatars/${path.basename(filePath)}`;
}

async function deletePublicFile(publicPath: string | undefined): Promise<void> {
  if (!publicPath) return;
  const abs = path.join(process.cwd(), publicPath);
  try {
    await fs.promises.unlink(abs);
  } catch {
    // file allaqachon yo'q — e'tiborsiz qoldiramiz
  }
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');

  if (input.name !== undefined) user.name = input.name;
  if (input.phone !== undefined) user.phone = input.phone;
  await user.save();
  return user;
}

export async function uploadAvatar(userId: string, file?: Express.Multer.File) {
  if (!file) throw new ApiError(400, 'Fayl yuklanmadi');

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');

  const publicPath = fileToPublicPath(file.path);
  const oldAvatar = user.avatar;
  user.avatar = publicPath;
  await user.save();

  if (oldAvatar && oldAvatar !== publicPath) {
    await deletePublicFile(oldAvatar);
  }
  return user;
}

export async function listAddresses(userId: string) {
  const user = await User.findById(userId).select('addresses');
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  return user.addresses;
}

export async function addAddress(userId: string, input: AddressInput) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');

  const data: Partial<UserAddress> = {
    label: input.label || 'Uy',
    fullName: input.fullName,
    phone: input.phone,
    country: input.country || 'O\'zbekiston',
    region: input.region,
    city: input.city,
    street: input.street,
    zip: input.zip,
    isDefault: input.isDefault ?? false,
  };

  if (user.addresses.length === 0) {
    data.isDefault = true;
  } else if (data.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }

  user.addresses.push(data as UserAddress);
  await user.save();
  return user.addresses;
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressInput
) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');

  const address = user.addresses.find((a) => a._id.toString() === addressId);
  if (!address) throw new ApiError(404, 'Manzil topilmadi');

  const allowed: (keyof AddressInput)[] = [
    'label',
    'fullName',
    'phone',
    'country',
    'region',
    'city',
    'street',
    'zip',
    'isDefault',
  ];

  if (input.isDefault) {
    user.addresses.forEach((a) => {
      a.isDefault = false;
    });
  }

  for (const key of allowed) {
    const value = input[key];
    if (value !== undefined) {
      (address as Record<string, unknown>)[key] = value;
    }
  }

  await user.save();
  return user.addresses;
}

export async function deleteAddress(userId: string, addressId: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');

  const index = user.addresses.findIndex((a) => a._id.toString() === addressId);
  if (index === -1) throw new ApiError(404, 'Manzil topilmadi');

  const wasDefault = user.addresses[index].isDefault;
  user.addresses.splice(index, 1);

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return user.addresses;
}

export async function setDefaultAddress(userId: string, addressId: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');

  const address = user.addresses.find((a) => a._id.toString() === addressId);
  if (!address) throw new ApiError(404, 'Manzil topilmadi');

  user.addresses.forEach((a) => {
    a.isDefault = false;
  });
  address.isDefault = true;
  await user.save();
  return user.addresses;
}

export async function applySeller(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  if (user.role === 'admin') {
    throw new ApiError(400, 'Admin seller bo\'la olmaydi');
  }
  if (user.role === 'seller' && user.isApproved) {
    throw new ApiError(400, 'Siz allaqachon seller sifatida tasdiqlangansiz');
  }
  if (user.role === 'seller' && !user.isApproved) {
    throw new ApiError(400, 'Arizo ko\'rib chiqilmoqda. Iltimos kuting');
  }

  user.role = 'seller';
  user.isApproved = false;
  await user.save();
  return user;
}

export interface ListUsersQuery {
  search?: string;
  role?: UserRole;
  page?: number;
  limit?: number;
}

export async function listUsers(query: ListUsersQuery) {
  const { search, role, page = 1, limit = 20 } = query;

  const filter: Record<string, unknown> = {};
  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (role) filter.role = role;

  const total = await User.countDocuments(filter);
  const users = await User.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function changeRole(userId: string, role: UserRole) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  if (user._id.toString() === userId && user.role === 'admin' && role !== 'admin') {
    throw new ApiError(400, 'O\'zingizning rolizni o\'chira olmaysiz');
  }

  user.role = role;
  if (role !== 'seller') {
    user.isApproved = false;
    user.storeId = undefined;
  }
  await user.save();
  return user;
}

export async function blockUser(userId: string, isBlocked: boolean) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');

  user.isBlocked = isBlocked;
  user.refreshToken = undefined;
  await user.save();
  return user;
}

export async function approveSeller(userId: string, isApproved: boolean) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Foydalanuvchi topilmadi');
  if (user.role !== 'seller') {
    throw new ApiError(400, 'Bu foydalanuvchi seller emas');
  }

  user.isApproved = isApproved;
  await user.save();

  if (isApproved && !user.storeId) {
    const existing = await Store.findOne({ owner: user._id });
    if (!existing) {
      const store = await Store.create({
        name: `${user.name} do'koni`,
        owner: user._id,
      });
      user.storeId = store._id;
      await user.save();
    }
  }
  return user;
}
