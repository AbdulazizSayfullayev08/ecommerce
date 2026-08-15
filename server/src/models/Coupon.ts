import { Schema, model, Types } from 'mongoose';

export type CouponType = 'percentage' | 'fixed';

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { type: String, enum: ['percentage', 'fixed'], required: true },
    value: { type: Number, required: true, min: 0 },
    minAmount: { type: Number, default: 0, min: 0 },
    maxDiscount: { type: Number, min: 0 },
    expiresAt: { type: Date },
    usageLimit: { type: Number, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export interface ICoupon {
  _id: Types.ObjectId;
  code: string;
  type: CouponType;
  value: number;
  minAmount: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const Coupon = model<ICoupon>('Coupon', couponSchema);

export default Coupon;
