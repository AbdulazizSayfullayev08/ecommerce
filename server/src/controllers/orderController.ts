import { Request, Response, NextFunction } from 'express';
import {
  listMyOrders,
  getMyOrder,
  listAdminOrders,
  listSellerOrders,
  updateOrderStatus,
} from '../services/orderService';

export async function myOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listMyOrders(req.user!.userId, req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function myOrderController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await getMyOrder(req.user!.userId, req.params.id as string);
    res.status(200).json({ success: true, data: { order } });
  } catch (err) {
    next(err);
  }
}

export async function adminOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listAdminOrders(req.query);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function sellerOrdersController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listSellerOrders(req.user!.userId);
    res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function orderStatusController(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await updateOrderStatus(req.params.id as string, req.body.status);
    res.status(200).json({ success: true, data: { order } });
  } catch (err) {
    next(err);
  }
}
