import { Request, Response } from 'express';
import {
  addItem,
  applyCoupon,
  clearCart,
  getCart,
  removeCoupon,
  removeItem,
  updateQty,
} from '../services/cartService';
import { asyncHandler } from '../utils/asyncHandler';

export const getCartController = asyncHandler(async (req: Request, res: Response) => {
  const data = await getCart(req.user!.userId);
  res.status(200).json({ success: true, data });
});

export const addItemController = asyncHandler(async (req: Request, res: Response) => {
  const data = await addItem(req.user!.userId, req.body.productId, req.body.qty);
  res.status(200).json({ success: true, data });
});

export const updateQtyController = asyncHandler(async (req: Request, res: Response) => {
  const data = await updateQty(
    req.user!.userId,
    req.params.productId as string,
    req.body.qty
  );
  res.status(200).json({ success: true, data });
});

export const removeItemController = asyncHandler(async (req: Request, res: Response) => {
  const data = await removeItem(req.user!.userId, req.params.productId as string);
  res.status(200).json({ success: true, data });
});

export const clearCartController = asyncHandler(async (req: Request, res: Response) => {
  const data = await clearCart(req.user!.userId);
  res.status(200).json({ success: true, data });
});

export const applyCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await applyCoupon(req.user!.userId, req.body.code);
    res.status(200).json({ success: true, data });
  }
);

export const removeCouponController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = await removeCoupon(req.user!.userId);
    res.status(200).json({ success: true, data });
  }
);
