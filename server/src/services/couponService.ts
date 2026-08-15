import Coupon, { CouponType } from '../models/Coupon';
import { ApiError } from '../utils/ApiError';

export interface CouponInput {
  code: string;
  type: CouponType;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  expiresAt?: string;
  usageLimit?: number;
  isActive?: boolean;
}

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function listCoupons() {
  return Coupon.find().sort({ createdAt: -1 });
}

export async function createCoupon(input: CouponInput) {
  const code = input.code.trim().toUpperCase();
  const existing = await Coupon.findOne({ code });
  if (existing) throw new ApiError(409, 'Bu kodli kupon mavjud');

  return Coupon.create({
    code,
    type: input.type,
    value: input.value,
    minAmount: input.minAmount ?? 0,
    maxDiscount: input.maxDiscount,
    expiresAt: parseDate(input.expiresAt),
    usageLimit: input.usageLimit,
    isActive: input.isActive ?? true,
  });
}

export async function updateCoupon(id: string, input: Partial<CouponInput>) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new ApiError(404, 'Kupon topilmadi');

  if (input.code !== undefined) {
    const code = input.code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code, _id: { $ne: id } });
    if (existing) throw new ApiError(409, 'Bu kodli kupon mavjud');
    coupon.code = code;
  }
  if (input.type !== undefined) coupon.type = input.type;
  if (input.value !== undefined) coupon.value = input.value;
  if (input.minAmount !== undefined) coupon.minAmount = input.minAmount;
  if (input.maxDiscount !== undefined) coupon.maxDiscount = input.maxDiscount;
  if (input.expiresAt !== undefined) coupon.expiresAt = parseDate(input.expiresAt);
  if (input.usageLimit !== undefined) coupon.usageLimit = input.usageLimit;
  if (input.isActive !== undefined) coupon.isActive = input.isActive;

  await coupon.save();
  return coupon;
}

export async function deleteCoupon(id: string) {
  const coupon = await Coupon.findById(id);
  if (!coupon) throw new ApiError(404, 'Kupon topilmadi');
  await coupon.deleteOne();
  return coupon;
}

export async function incrementCouponUsage(code: string) {
  await Coupon.updateOne({ code }, { $inc: { usedCount: 1 } });
}
