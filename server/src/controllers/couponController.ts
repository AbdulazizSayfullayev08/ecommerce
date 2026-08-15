import { Request, Response } from 'express';
import {
  createCoupon,
  deleteCoupon,
  listCoupons,
  updateCoupon,
} from '../services/couponService';
import { asyncHandler } from '../utils/asyncHandler';

export const getCoupons = asyncHandler(async (_req: Request, res: Response) => {
  const coupons = await listCoupons();
  res.status(200).json({ success: true, data: { coupons } });
});

export const createCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    const coupon = await createCoupon(req.body);
    res.status(201).json({ success: true, data: { coupon } });
  }
);

export const updateCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    const coupon = await updateCoupon(req.params.id as string, req.body);
    res.status(200).json({ success: true, data: { coupon } });
  }
);

export const deleteCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    const coupon = await deleteCoupon(req.params.id as string);
    res.status(200).json({ success: true, data: { coupon } });
  }
);
