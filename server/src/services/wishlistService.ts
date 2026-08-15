import Wishlist, { IWishlist } from '../models/Wishlist';
import Product from '../models/Product';
import { ApiError } from '../utils/ApiError';
import { HydratedDocument } from 'mongoose';

async function getOrCreate(userId: string): Promise<HydratedDocument<IWishlist>> {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: userId, items: [] });
  }
  return wishlist;
}

export async function getWishlist(userId: string) {
  const wishlist = await getOrCreate(userId);

  const products = await Product.find({
    _id: { $in: wishlist.items.map((i) => i.product) },
    isActive: true,
  })
    .populate('category', 'name slug')
    .populate('seller', 'name avatar');

  return { items: products, total: products.length };
}

export async function getWishlistIds(userId: string): Promise<string[]> {
  const wishlist = await getOrCreate(userId);
  return wishlist.items.map((i) => i.product.toString());
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Mahsulot topilmadi');
  }

  const wishlist = await getOrCreate(userId);
  if (!wishlist.items.some((i) => i.product.toString() === productId)) {
    wishlist.items.push({ product: product._id, addedAt: new Date() });
    await wishlist.save();
  }
  return { added: true };
}

export async function removeFromWishlist(userId: string, productId: string) {
  const wishlist = await getOrCreate(userId);
  wishlist.items = wishlist.items.filter((i) => i.product.toString() !== productId);
  await wishlist.save();
  return { added: false };
}

export async function clearWishlist(userId: string) {
  const wishlist = await getOrCreate(userId);
  wishlist.items = [];
  await wishlist.save();
}
